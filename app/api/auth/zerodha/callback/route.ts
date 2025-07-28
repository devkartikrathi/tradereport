import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { KiteConnect } from "kiteconnect";
import { PrismaClient } from "@prisma/client";
import { encryptToken } from "@/lib/services/encryption-service";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const { searchParams } = new URL(request.url);
    const requestToken = searchParams.get('request_token');
    const action = searchParams.get('action');

    if (action === 'login') {
      if (!requestToken) {
        return NextResponse.redirect(new URL('/broker-connection?error=no_request_token', request.url));
      }

      const apiKey = process.env.ZERODHA_API_KEY;
      const apiSecret = process.env.ZERODHA_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        console.error("Zerodha API credentials not configured");
        return NextResponse.redirect(new URL('/broker-connection?error=config_error', request.url));
      }

      const kite = new KiteConnect({
        api_key: apiKey,
      });

      try {
        // Generate session with request token
        const sessionData = await kite.generateSession(requestToken, apiSecret);
        
        // Encrypt the access token before storing
        const encryptedToken = await encryptToken(sessionData.access_token);
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user) {
          return NextResponse.redirect(new URL('/broker-connection?error=user_not_found', request.url));
        }

        // Store or update broker connection
        await prisma.brokerConnection.upsert({
          where: {
            userId_broker: {
              userId: user.id,
              broker: 'zerodha'
            }
          },
          update: {
            encryptedAccessToken: encryptedToken,
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            broker: 'zerodha',
            encryptedAccessToken: encryptedToken,
          },
        });

        console.log(`Zerodha connection established for user: ${userId}`);
        return NextResponse.redirect(new URL('/upload?success=zerodha_connected', request.url));

      } catch (error) {
        console.error("Error generating Zerodha session:", error);
        return NextResponse.redirect(new URL('/broker-connection?error=session_error', request.url));
      }
    }

    // Handle other actions (logout, etc.)
    return NextResponse.redirect(new URL('/broker-connection', request.url));

  } catch (error) {
    console.error("Error in Zerodha callback:", error);
    return NextResponse.redirect(new URL('/broker-connection?error=callback_error', request.url));
  }
} 
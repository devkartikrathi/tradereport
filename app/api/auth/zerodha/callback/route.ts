import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { KiteConnect } from "kiteconnect";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { encryptToken } from "@/lib/services/encryption-service";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Log all query parameters for debugging
    logger.info("Zerodha callback received", {
      userId,
      queryParams: Object.fromEntries(searchParams.entries())
    });

    // Extract parameters from callback
    const requestToken = searchParams.get("request_token");
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sess_id");
    const apiKey = searchParams.get("api_key");

    if (!requestToken) {
      logger.error("No request token received from Zerodha", {
        userId,
        queryParams: Object.fromEntries(searchParams.entries())
      });
      return NextResponse.json(
        { error: "No request token received" },
        { status: 400 }
      );
    }

    if (action === "reject" || status === "failure") {
      logger.warn("Zerodha authentication was rejected or failed", { userId });
      return NextResponse.redirect(new URL("/broker-connection?error=auth_failed", request.url));
    }

    const apiSecret = process.env.ZERODHA_API_SECRET;

    if (!apiSecret) {
      logger.error("Zerodha API secret not configured");
      return NextResponse.json(
        { error: "Zerodha API credentials not configured" },
        { status: 500 }
      );
    }

    // Generate session with request token
    const kiteApiKey = apiKey || process.env.ZERODHA_API_KEY || "";
    if (!kiteApiKey) {
      logger.error("No API key available for KiteConnect");
      return NextResponse.json(
        { error: "API key not available" },
        { status: 500 }
      );
    }
    const kite = new KiteConnect({ api_key: kiteApiKey });
    const sessionData = await kite.generateSession(requestToken, apiSecret);

    // Get user profile
    kite.setAccessToken(sessionData.access_token);
    const profile = await kite.getProfile();

    // Ensure user exists in database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: profile.email || "",
        firstName: sessionData.user_name?.split(' ')[0] || "",
        lastName: sessionData.user_name?.split(' ').slice(1).join(' ') || "",
      }
    });

    // Encrypt the access token before storing
    const encryptedAccessToken = await encryptToken(sessionData.access_token);

    // Save or update broker connection
    await prisma.brokerConnection.upsert({
      where: {
        userId_broker: {
          userId: user.id,
          broker: "zerodha"
        }
      },
      update: {
        encryptedAccessToken: encryptedAccessToken,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        broker: "zerodha",
        encryptedAccessToken: encryptedAccessToken,
      }
    });

    logger.info("Zerodha connection established successfully", {
      userId: user.id,
      zerodhaUserId: sessionData.user_id,
      userName: sessionData.user_name,
      email: profile.email,
      sessionId,
      apiKey
    });

    // Redirect to profile page with success message
    return NextResponse.redirect(new URL("/profile?success=zerodha_connected", request.url));

  } catch (error) {
    logger.error("Error processing Zerodha callback", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
    });

    // Redirect to broker connection page with error
    return NextResponse.redirect(new URL("/broker-connection?error=connection_failed", request.url));
  }
} 
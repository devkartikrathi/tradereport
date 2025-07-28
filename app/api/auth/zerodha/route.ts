import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { KiteConnect } from "kiteconnect";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ZERODHA_API_KEY;
    const apiSecret = process.env.ZERODHA_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.error("Zerodha API credentials not configured");
      return NextResponse.json(
        { error: "Broker integration not configured" },
        { status: 500 }
      );
    }

    const kite = new KiteConnect({
      api_key: apiKey,
    });

    // Generate login URL
    const loginUrl = kite.getLoginURL();
    
    // Redirect user to Zerodha login
    return NextResponse.redirect(loginUrl);

  } catch (error) {
    console.error("Error initiating Zerodha OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { KiteConnect } from "kiteconnect";
import { logger } from "@/lib/logger";

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

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ZERODHA_API_KEY;
    const apiSecret = process.env.ZERODHA_API_SECRET;

    if (!apiKey || !apiSecret) {
      logger.error("Zerodha API credentials not configured");
      return NextResponse.json(
        { error: "Zerodha API credentials not configured" },
        { status: 500 }
      );
    }

    // Create KiteConnect instance
    const kite = new KiteConnect({ api_key: apiKey });

    // Generate login URL with session ID
    const loginUrl = kite.getLoginURL();

    logger.info("Zerodha login URL generated", { userId });

    return NextResponse.json({
      loginUrl,
      apiKey
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    logger.error("Error generating Zerodha login URL", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
    });
    return NextResponse.json(
      { error: "Failed to generate login URL" },
      { status: 500 }
    );
  }
} 
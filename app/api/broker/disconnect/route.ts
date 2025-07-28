import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const broker = formData.get('broker') as string;

    if (!broker) {
      return NextResponse.json({ error: "Broker not specified" }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete broker connection
    await prisma.brokerConnection.deleteMany({
      where: {
        userId: user.id,
        broker: broker,
      },
    });

    console.log(`Broker ${broker} disconnected for user: ${userId}`);
    
    return NextResponse.redirect(new URL('/broker-connection?success=disconnected', request.url));

  } catch (error) {
    console.error("Error disconnecting broker:", error);
    return NextResponse.redirect(new URL('/broker-connection?error=disconnect_error', request.url));
  }
} 
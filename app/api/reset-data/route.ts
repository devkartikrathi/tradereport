import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user record
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete all trades and analytics for this user
    await prisma.$transaction(async (tx) => {
      // Delete all trades
      await tx.trade.deleteMany({
        where: { userId: userRecord.id },
      });

      // Delete analytics data
      await tx.analytics.deleteMany({
        where: { userId: userRecord.id },
      });
    });

    return NextResponse.json(
      { 
        message: "All trade data has been successfully deleted",
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error resetting user data:", error);
    return NextResponse.json(
      { error: "Failed to reset data. Please try again." },
      { status: 500 }
    );
  }
} 
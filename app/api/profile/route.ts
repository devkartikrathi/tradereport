import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get or create user profile
        let userProfile = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!userProfile) {
            userProfile = await prisma.user.create({
                data: {
                    clerkId: userId,
                    email: user.emailAddresses[0]?.emailAddress || "",
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                },
            });
        }

        return NextResponse.json({
            id: userProfile.id,
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            createdAt: userProfile.createdAt,
            updatedAt: userProfile.updatedAt,
        });

    } catch (error) {
        logger.error("Profile API error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { firstName, lastName } = await request.json();

        // Validate input
        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: "First name and last name are required" },
                { status: 400 }
            );
        }

        // Update user profile
        const updatedProfile = await prisma.user.update({
            where: { clerkId: userId },
            data: {
                firstName,
                lastName,
            },
        });

        logger.info("Profile updated", {
            userId: updatedProfile.id,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
        });

        return NextResponse.json({
            id: updatedProfile.id,
            email: updatedProfile.email,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            createdAt: updatedProfile.createdAt,
            updatedAt: updatedProfile.updatedAt,
        });

    } catch (error) {
        logger.error("Profile update error", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: await auth().then(auth => auth.userId).catch(() => "unknown"),
        });

        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
} 
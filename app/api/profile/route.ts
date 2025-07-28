import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

interface ProfileUpdateRequest {
    firstName?: string;
    lastName?: string;
}

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        });

    } catch (error) {
        logger.error("Error fetching user profile", {
            error: error instanceof Error ? error.message : "Unknown error",
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

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Parse request body
        const body = await request.json();
        const updateData: ProfileUpdateRequest = {
            firstName: body.firstName,
            lastName: body.lastName
        };

        // Validate input
        const validationErrors: string[] = [];

        if (updateData.firstName !== undefined && updateData.firstName !== null) {
            if (typeof updateData.firstName !== 'string') {
                validationErrors.push("First name must be a string");
            } else if (updateData.firstName.length > 50) {
                validationErrors.push("First name must be less than 50 characters");
            }
        }

        if (updateData.lastName !== undefined && updateData.lastName !== null) {
            if (typeof updateData.lastName !== 'string') {
                validationErrors.push("Last name must be a string");
            } else if (updateData.lastName.length > 50) {
                validationErrors.push("Last name must be less than 50 characters");
            }
        }

        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: "Invalid profile data",
                    details: validationErrors
                },
                { status: 400 }
            );
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                firstName: updateData.firstName,
                lastName: updateData.lastName,
                updatedAt: new Date()
            }
        });

        logger.info("User profile updated successfully", {
            userId: user.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName
        });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                createdAt: updatedUser.createdAt.toISOString(),
                updatedAt: updatedUser.updatedAt.toISOString()
            }
        });

    } catch (error) {
        logger.error("Error updating user profile", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 
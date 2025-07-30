import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { s3Service } from "@/lib/services/s3-service";
import { subscriptionMiddleware } from "@/lib/middleware/subscription-middleware";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate subscription for trade validator feature
        const validation = await subscriptionMiddleware.validateSubscription(userId);
        if (!validation.hasAccess) {
            return NextResponse.json(
                {
                    error: "Premium subscription required for trade validator",
                    details: validation.error,
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        // Get user from database to get the internal user ID
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Please upload JPG, PNG, or WebP images only"
            }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: "File size too large. Please upload images smaller than 5MB"
            }, { status: 400 });
        }

        // Upload to S3
        const { imageUrl, imageKey } = await s3Service.uploadImage(file, user.id);

        logger.info("Image uploaded successfully", {
            userId: user.id,
            imageKey,
            fileSize: file.size,
            contentType: file.type,
        });

        return NextResponse.json({
            success: true,
            imageUrl,
            imageId: imageKey,
            message: "Image uploaded successfully"
        });

    } catch (error) {
        logger.error("Error uploading image", {
            error: error instanceof Error ? error.message : "Unknown error",
        });

        return NextResponse.json(
            {
                error: "Failed to upload image",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

export class S3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
        this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    }

    private generateImageKey(userId: string, fileName: string): string {
        const timestamp = Date.now();
        const extension = fileName.split('.').pop();
        return `trade-validator/${userId}/${timestamp}.${extension}`;
    }

    async uploadImage(file: File, userId: string): Promise<{ imageUrl: string; imageKey: string }> {
        try {
            const imageKey = this.generateImageKey(userId, file.name);

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: imageKey,
                Body: file,
                ContentType: file.type,
                Metadata: {
                    userId,
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                },
            });

            await this.s3Client.send(command);

            // Generate a presigned URL for immediate access
            const presignedUrl = await this.generatePresignedUrl(imageKey);

            logger.info('Image uploaded successfully', {
                userId,
                imageKey,
                fileSize: file.size,
                contentType: file.type,
            });

            return {
                imageUrl: presignedUrl,
                imageKey,
            };
        } catch (error) {
            logger.error('Error uploading image to S3', {
                userId,
                fileName: file.name,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to upload image to S3');
        }
    }

    async generatePresignedUrl(imageKey: string): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: imageKey,
            });

            const presignedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn: 3600, // 1 hour
            });

            return presignedUrl;
        } catch (error) {
            logger.error('Error generating presigned URL', {
                imageKey,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to generate presigned URL');
        }
    }

    async deleteImage(imageKey: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: imageKey,
            });

            await this.s3Client.send(command);

            logger.info('Image deleted successfully', {
                imageKey,
            });
        } catch (error) {
            logger.error('Error deleting image from S3', {
                imageKey,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to delete image from S3');
        }
    }

    async getImageUrl(imageKey: string): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: imageKey,
            });

            const presignedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn: 3600, // 1 hour
            });

            return presignedUrl;
        } catch (error) {
            logger.error('Error getting image URL', {
                imageKey,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to get image URL');
        }
    }
}

export const s3Service = new S3Service(); 
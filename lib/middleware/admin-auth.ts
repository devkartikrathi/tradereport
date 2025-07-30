import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

export interface AdminUser {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
}

export interface AdminAuthConfig {
    requireAdmin: boolean;
    requiredPermissions?: string[];
    allowedRoles?: string[];
}

/**
 * Check if user is admin
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
    try {
        // For development/testing, allow specific user IDs
        const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
        const isAdminById = adminUserIds.includes(userId);

        // In production, you would check against a database or Clerk metadata
        // For now, we'll use the environment variable approach
        return isAdminById;
    } catch (error) {
        logger.error("Error checking admin role", { userId, error: error instanceof Error ? error.message : "Unknown error" });
        return false;
    }
}

/**
 * Get admin user information
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
        const isAdmin = await checkAdminRole(userId);

        if (!isAdmin) {
            return null;
        }

        // Get user details from Clerk
        const { user } = await auth();

        return {
            userId,
            email: user?.emailAddresses?.[0]?.emailAddress || "",
            role: "admin",
            permissions: [
                "plans:read",
                "plans:write",
                "plans:delete",
                "subscriptions:read",
                "subscriptions:write",
                "users:read",
                "analytics:read"
            ]
        };
    } catch (error) {
        logger.error("Error getting admin user", { userId, error: error instanceof Error ? error.message : "Unknown error" });
        return null;
    }
}

/**
 * Check if admin user has specific permission
 */
export async function hasAdminPermission(userId: string, permission: string): Promise<boolean> {
    try {
        const adminUser = await getAdminUser(userId);

        if (!adminUser) {
            return false;
        }

        return adminUser.permissions.includes(permission);
    } catch (error) {
        logger.error("Error checking admin permission", { userId, permission, error: error instanceof Error ? error.message : "Unknown error" });
        return false;
    }
}

/**
 * Admin authentication middleware
 */
export async function adminAuthMiddleware(
    request: NextRequest,
    config: AdminAuthConfig = { requireAdmin: true }
): Promise<{ isAuthorized: boolean; adminUser?: AdminUser; error?: string }> {
    try {
        // Get user from Clerk
        const { userId } = await auth();

        if (!userId) {
            return {
                isAuthorized: false,
                error: "Unauthorized - User not authenticated"
            };
        }

        // Check if user is admin
        const adminUser = await getAdminUser(userId);

        if (!adminUser && config.requireAdmin) {
            return {
                isAuthorized: false,
                error: "Forbidden - Admin access required"
            };
        }

        // Check role restrictions
        if (config.allowedRoles && adminUser && !config.allowedRoles.includes(adminUser.role)) {
            return {
                isAuthorized: false,
                error: `Forbidden - Role '${adminUser.role}' not allowed`
            };
        }

        // Check permission restrictions
        if (config.requiredPermissions && adminUser) {
            const hasAllPermissions = config.requiredPermissions.every(permission =>
                adminUser.permissions.includes(permission)
            );

            if (!hasAllPermissions) {
                return {
                    isAuthorized: false,
                    error: `Forbidden - Missing required permissions: ${config.requiredPermissions.join(", ")}`
                };
            }
        }

        return {
            isAuthorized: true,
            adminUser
        };
    } catch (error) {
        logger.error("Error in admin auth middleware", { error: error instanceof Error ? error.message : "Unknown error" });
        return {
            isAuthorized: false,
            error: "Internal server error during authentication"
        };
    }
}

/**
 * Create admin-only API route wrapper
 */
export function createAdminRoute(config: AdminAuthConfig = { requireAdmin: true }) {
    return async function adminRouteHandler(
        request: NextRequest,
        handler: (request: NextRequest, adminUser: AdminUser) => Promise<NextResponse>
    ): Promise<NextResponse> {
        const authResult = await adminAuthMiddleware(request, config);

        if (!authResult.isAuthorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.error?.includes("Unauthorized") ? 401 : 403 }
            );
        }

        try {
            return await handler(request, authResult.adminUser!);
        } catch (error) {
            logger.error("Error in admin route handler", { error: error instanceof Error ? error.message : "Unknown error" });
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    };
}

/**
 * Admin permission decorator for API routes
 */
export function requireAdminPermission(permission: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const request = args[0] as NextRequest;
            const { userId } = await auth();

            if (!userId) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            const hasPermission = await hasAdminPermission(userId, permission);

            if (!hasPermission) {
                return NextResponse.json(
                    { error: `Forbidden - Missing permission: ${permission}` },
                    { status: 403 }
                );
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * Admin role decorator for API routes
 */
export function requireAdminRole(role: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const request = args[0] as NextRequest;
            const { userId } = await auth();

            if (!userId) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            const adminUser = await getAdminUser(userId);

            if (!adminUser || adminUser.role !== role) {
                return NextResponse.json(
                    { error: `Forbidden - Role '${role}' required` },
                    { status: 403 }
                );
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
} 
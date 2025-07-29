import { toast } from "sonner";

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
    success?: boolean;
}

export interface ApiError {
    message: string;
    status: number;
    details?: unknown;
}

class ApiClient {
    private baseURL: string;
    private defaultHeaders: HeadersInit;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        this.defaultHeaders = {
            "Content-Type": "application/json",
        };
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                if (contentType?.includes("application/json")) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } catch {
                        // Fallback to default error message
                    }
                }

                throw new Error(errorMessage);
            }

            if (contentType?.includes("application/json")) {
                const data = await response.json();
                return { data, success: true };
            }

            // Handle non-JSON responses
            const text = await response.text();
            return { data: text as T, success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Network error";

            // Log error for debugging
            console.error("API Error:", {
                endpoint,
                error: errorMessage,
                timestamp: new Date().toISOString(),
            });

            return {
                error: errorMessage,
                success: false,
            };
        }
    }

    // Analytics API
    async getAnalytics(period: string = "1y"): Promise<ApiResponse<unknown>> {
        return this.request(`/api/analytics?period=${period}`);
    }

    // Upload API
    async uploadTrades(formData: FormData): Promise<ApiResponse<unknown>> {
        return this.request("/api/upload-trades", {
            method: "POST",
            body: formData,
            headers: {}, // Let browser set content-type for FormData
        });
    }

    // Chat API
    async sendChatMessage(message: string, sessionId?: string): Promise<ApiResponse<unknown>> {
        return this.request("/api/chatbot", {
            method: "POST",
            body: JSON.stringify({ message, sessionId }),
        });
    }

    // Reset Data API
    async resetData(): Promise<ApiResponse<unknown>> {
        return this.request("/api/reset-data", {
            method: "DELETE",
        });
    }

    // Performance Goals API
    async getPerformanceGoals(): Promise<ApiResponse<unknown>> {
        return this.request("/api/performance-goals");
    }

    async createPerformanceGoal(goal: unknown): Promise<ApiResponse<unknown>> {
        return this.request("/api/performance-goals", {
            method: "POST",
            body: JSON.stringify(goal),
        });
    }

    async updatePerformanceGoal(id: string, goal: unknown): Promise<ApiResponse<unknown>> {
        return this.request(`/api/performance-goals/${id}`, {
            method: "PUT",
            body: JSON.stringify(goal),
        });
    }

    async deletePerformanceGoal(id: string): Promise<ApiResponse<unknown>> {
        return this.request(`/api/performance-goals/${id}`, {
            method: "DELETE",
        });
    }

    // Risk Management API
    async getRiskAssessment(): Promise<ApiResponse<unknown>> {
        return this.request("/api/risk-management/analysis");
    }

    async getRiskCoaching(): Promise<ApiResponse<unknown>> {
        return this.request("/api/risk-management/coaching");
    }

    // Behavioral Analysis API
    async getBehavioralInsights(): Promise<ApiResponse<unknown>> {
        return this.request("/api/behavioral/insights");
    }

    async getBehavioralCoaching(): Promise<ApiResponse<unknown>> {
        return this.request("/api/behavioral/coaching");
    }

    // Trading Rules API
    async getTradingRules(): Promise<ApiResponse<unknown>> {
        return this.request("/api/trading-rules");
    }

    async createTradingRule(rule: unknown): Promise<ApiResponse<unknown>> {
        return this.request("/api/trading-rules", {
            method: "POST",
            body: JSON.stringify(rule),
        });
    }

    // Monitoring API
    async getLiveMonitoring(): Promise<ApiResponse<unknown>> {
        return this.request("/api/monitoring/live");
    }

    // Profile API
    async getProfile(): Promise<ApiResponse<unknown>> {
        return this.request("/api/profile");
    }

    async updateProfile(profile: unknown): Promise<ApiResponse<unknown>> {
        return this.request("/api/profile", {
            method: "PUT",
            body: JSON.stringify(profile),
        });
    }

    // Broker Connection API
    async getBrokerConnections(): Promise<ApiResponse<unknown>> {
        return this.request("/api/broker/connections");
    }

    async disconnectBroker(brokerId: string): Promise<ApiResponse<unknown>> {
        return this.request(`/api/broker/disconnect`, {
            method: "POST",
            body: JSON.stringify({ brokerId }),
        });
    }

    async getZerodhaLoginUrl(): Promise<ApiResponse<unknown>> {
        return this.request("/api/auth/zerodha", {
            method: "GET",
        });
    }

    async importBrokerData(brokerId: string): Promise<ApiResponse<unknown>> {
        return this.request(`/api/broker/import-data`, {
            method: "POST",
            body: JSON.stringify({ brokerId }),
        });
    }

    // Alerts API
    async getAlerts(): Promise<ApiResponse<unknown>> {
        return this.request("/api/alerts");
    }

    async createAlert(alert: unknown): Promise<ApiResponse<unknown>> {
        return this.request("/api/alerts", {
            method: "POST",
            body: JSON.stringify(alert),
        });
    }

    // Generic error handler
    handleError(error: ApiResponse<unknown>, showToast: boolean = true): void {
        if (error.error && showToast) {
            toast.error(error.error);
        }
    }

    // Retry wrapper for critical operations
    async withRetry<T>(
        operation: () => Promise<ApiResponse<T>>,
        maxRetries: number = 3,
        delay: number = 1000
    ): Promise<ApiResponse<T>> {
        let lastError: ApiResponse<T>;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();

                if (result.success) {
                    return result;
                }

                lastError = result;
            } catch (error) {
                lastError = {
                    error: error instanceof Error ? error.message : "Unknown error",
                    success: false,
                };
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }

        return lastError!;
    }
}

// Export singleton instance
export const apiClient = new ApiClient(); 
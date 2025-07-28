import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface ChatAnalytics {
    totalMessages: number;
    totalSessions: number;
    averageMessagesPerSession: number;
    mostActiveHours: Array<{ hour: number; count: number }>;
    queryTypeDistribution: Array<{ type: string; count: number }>;
    averageResponseTime: number;
    userSatisfactionScore: number;
    lastActivity: Date;
}

export interface UserInsights {
    preferredQueryTypes: string[];
    activeHours: number[];
    averageSessionLength: number;
    commonTopics: string[];
    improvementAreas: string[];
}

export interface ChatMessage {
    id: string;
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sessionId?: string;
    metadata?: {
        queryType?: string;
        confidence?: number;
        suggestedActions?: string[];
        responseTime?: number;
        userFeedback?: 'thumbsUp' | 'thumbsDown' | null;
    };
}

export class ChatAnalyticsService {
    /**
     * Track user interaction with chat
     */
    async trackUserInteraction(
        userId: string,
        message: string,
        response: string,
        sessionId?: string,
        metadata?: {
            queryType?: string;
            confidence?: number;
            responseTime?: number;
        }
    ): Promise<void> {
        try {
            // Store user message
            await prisma.chatMessage.create({
                data: {
                    userId,
                    role: 'user',
                    content: message,
                    sessionId,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                },
            });

            // Store assistant response
            await prisma.chatMessage.create({
                data: {
                    userId,
                    role: 'assistant',
                    content: response,
                    sessionId,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                },
            });

            logger.info('Chat interaction tracked', {
                userId,
                sessionId,
                messageLength: message.length,
                responseLength: response.length,
                queryType: metadata?.queryType
            });
        } catch (error) {
            logger.error('Failed to track chat interaction', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get conversation history for a user
     */
    async getConversationHistory(
        userId: string,
        limit: number = 50,
        sessionId?: string
    ): Promise<ChatMessage[]> {
        try {
            const whereClause: any = { userId };
            if (sessionId) {
                whereClause.sessionId = sessionId;
            }

            const messages = await prisma.chatMessage.findMany({
                where: whereClause,
                orderBy: { timestamp: 'desc' },
                take: limit,
            });

            return messages.map(msg => ({
                ...msg,
                metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
            }));
        } catch (error) {
            logger.error('Failed to get conversation history', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Get user's chat sessions
     */
    async getUserSessions(userId: string): Promise<Array<{ sessionId: string; messageCount: number; lastActivity: Date }>> {
        try {
            const sessions = await prisma.chatMessage.groupBy({
                by: ['sessionId'],
                where: {
                    userId,
                    sessionId: { not: null }
                },
                _count: {
                    id: true,
                },
                _max: {
                    timestamp: true,
                },
            });

            return sessions
                .filter(session => session.sessionId)
                .map(session => ({
                    sessionId: session.sessionId!,
                    messageCount: session._count.id,
                    lastActivity: session._max.timestamp!,
                }))
                .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        } catch (error) {
            logger.error('Failed to get user sessions', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Get chat analytics for a user
     */
    async getChatAnalytics(userId: string): Promise<ChatAnalytics> {
        try {
            const messages = await prisma.chatMessage.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            });

            if (messages.length === 0) {
                return {
                    totalMessages: 0,
                    totalSessions: 0,
                    averageMessagesPerSession: 0,
                    mostActiveHours: [],
                    queryTypeDistribution: [],
                    averageResponseTime: 0,
                    userSatisfactionScore: 0,
                    lastActivity: new Date(),
                };
            }

            // Calculate basic metrics
            const totalMessages = messages.length;
            const sessions = new Set(messages.filter(m => m.sessionId).map(m => m.sessionId!));
            const totalSessions = sessions.size;
            const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

            // Calculate active hours
            const hourCounts = new Map<number, number>();
            messages.forEach(msg => {
                const hour = msg.timestamp.getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            });
            const mostActiveHours = Array.from(hourCounts.entries())
                .map(([hour, count]) => ({ hour, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Calculate query type distribution
            const queryTypeCounts = new Map<string, number>();
            messages.forEach(msg => {
                if (msg.metadata) {
                    try {
                        const metadata = JSON.parse(msg.metadata as string);
                        if (metadata.queryType) {
                            queryTypeCounts.set(metadata.queryType, (queryTypeCounts.get(metadata.queryType) || 0) + 1);
                        }
                    } catch (e) {
                        // Ignore invalid JSON
                    }
                }
            });
            const queryTypeDistribution = Array.from(queryTypeCounts.entries())
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);

            // Calculate average response time (simplified)
            let totalResponseTime = 0;
            let responseTimeCount = 0;
            messages.forEach(msg => {
                if (msg.metadata) {
                    try {
                        const metadata = JSON.parse(msg.metadata as string);
                        if (metadata.responseTime) {
                            totalResponseTime += metadata.responseTime;
                            responseTimeCount++;
                        }
                    } catch (e) {
                        // Ignore invalid JSON
                    }
                }
            });
            const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

            // Calculate user satisfaction (simplified - based on message length and frequency)
            const userMessages = messages.filter(m => m.role === 'user');
            const assistantMessages = messages.filter(m => m.role === 'assistant');
            const userSatisfactionScore = userMessages.length > 0 && assistantMessages.length > 0
                ? Math.min(100, (assistantMessages.length / userMessages.length) * 100)
                : 0;

            return {
                totalMessages,
                totalSessions,
                averageMessagesPerSession,
                mostActiveHours,
                queryTypeDistribution,
                averageResponseTime,
                userSatisfactionScore,
                lastActivity: messages[0]?.timestamp || new Date(),
            };
        } catch (error) {
            logger.error('Failed to get chat analytics', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                totalMessages: 0,
                totalSessions: 0,
                averageMessagesPerSession: 0,
                mostActiveHours: [],
                queryTypeDistribution: [],
                averageResponseTime: 0,
                userSatisfactionScore: 0,
                lastActivity: new Date(),
            };
        }
    }

    /**
     * Generate user insights based on chat patterns
     */
    async generateUserInsights(userId: string): Promise<UserInsights> {
        try {
            const messages = await prisma.chatMessage.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
            });

            if (messages.length === 0) {
                return {
                    preferredQueryTypes: [],
                    activeHours: [],
                    averageSessionLength: 0,
                    commonTopics: [],
                    improvementAreas: [],
                };
            }

            // Analyze query types
            const queryTypeCounts = new Map<string, number>();
            messages.forEach(msg => {
                if (msg.metadata) {
                    try {
                        const metadata = JSON.parse(msg.metadata as string);
                        if (metadata.queryType) {
                            queryTypeCounts.set(metadata.queryType, (queryTypeCounts.get(metadata.queryType) || 0) + 1);
                        }
                    } catch (e) {
                        // Ignore invalid JSON
                    }
                }
            });
            const preferredQueryTypes = Array.from(queryTypeCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([type]) => type);

            // Analyze active hours
            const hourCounts = new Map<number, number>();
            messages.forEach(msg => {
                const hour = msg.timestamp.getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            });
            const activeHours = Array.from(hourCounts.entries())
                .filter(([_, count]) => count > 1)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([hour]) => hour);

            // Calculate average session length
            const sessions = new Map<string, number>();
            messages.forEach(msg => {
                if (msg.sessionId) {
                    sessions.set(msg.sessionId, (sessions.get(msg.sessionId) || 0) + 1);
                }
            });
            const averageSessionLength = sessions.size > 0
                ? Array.from(sessions.values()).reduce((a, b) => a + b, 0) / sessions.size
                : 0;

            // Analyze common topics (simplified - based on keywords)
            const userMessages = messages.filter(m => m.role === 'user');
            const commonTopics = this.extractCommonTopics(userMessages.map(m => m.content));

            // Identify improvement areas
            const improvementAreas = this.identifyImprovementAreas(messages);

            return {
                preferredQueryTypes,
                activeHours,
                averageSessionLength,
                commonTopics,
                improvementAreas,
            };
        } catch (error) {
            logger.error('Failed to generate user insights', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                preferredQueryTypes: [],
                activeHours: [],
                averageSessionLength: 0,
                commonTopics: [],
                improvementAreas: [],
            };
        }
    }

    /**
     * Clear conversation history for a user
     */
    async clearConversationHistory(userId: string, sessionId?: string): Promise<void> {
        try {
            const whereClause: any = { userId };
            if (sessionId) {
                whereClause.sessionId = sessionId;
            }

            await prisma.chatMessage.deleteMany({
                where: whereClause,
            });

            logger.info('Conversation history cleared', { userId, sessionId });
        } catch (error) {
            logger.error('Failed to clear conversation history', {
                userId,
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Extract common topics from messages
     */
    private extractCommonTopics(messages: string[]): string[] {
        const topics = new Map<string, number>();
        const tradingKeywords = [
            'performance', 'profit', 'loss', 'win rate', 'drawdown', 'risk',
            'symbol', 'stock', 'trade', 'position', 'entry', 'exit',
            'time', 'hour', 'day', 'pattern', 'trend', 'volatility'
        ];

        messages.forEach(message => {
            const lowerMessage = message.toLowerCase();
            tradingKeywords.forEach(keyword => {
                if (lowerMessage.includes(keyword)) {
                    topics.set(keyword, (topics.get(keyword) || 0) + 1);
                }
            });
        });

        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
    }

    /**
     * Identify areas for improvement based on chat patterns
     */
    private identifyImprovementAreas(messages: any[]): string[] {
        const improvements: string[] = [];

        // Check for short sessions (might indicate confusion)
        const sessions = new Map<string, number>();
        messages.forEach(msg => {
            if (msg.sessionId) {
                sessions.set(msg.sessionId, (sessions.get(msg.sessionId) || 0) + 1);
            }
        });

        const shortSessions = Array.from(sessions.values()).filter(count => count < 3).length;
        if (shortSessions > sessions.size * 0.5) {
            improvements.push('Consider asking more detailed questions for better analysis');
        }

        // Check for repeated questions
        const userMessages = messages.filter(m => m.role === 'user');
        const messageContent = userMessages.map(m => m.content.toLowerCase());
        const uniqueQuestions = new Set(messageContent);
        if (messageContent.length > uniqueQuestions.size * 1.5) {
            improvements.push('Try exploring different aspects of your trading data');
        }

        // Check for basic vs advanced questions
        const basicKeywords = ['performance', 'profit', 'loss'];
        const advancedKeywords = ['drawdown', 'volatility', 'correlation', 'risk-adjusted'];

        const basicQuestions = messageContent.filter(msg =>
            basicKeywords.some(keyword => msg.includes(keyword))
        ).length;
        const advancedQuestions = messageContent.filter(msg =>
            advancedKeywords.some(keyword => msg.includes(keyword))
        ).length;

        if (basicQuestions > advancedQuestions * 2) {
            improvements.push('Explore more advanced analytics like risk metrics and correlations');
        }

        return improvements;
    }
} 
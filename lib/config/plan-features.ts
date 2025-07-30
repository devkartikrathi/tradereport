export interface PlanFeature {
    id: string;
    name: string;
    description: string;
    category: 'analytics' | 'ai' | 'trading' | 'monitoring' | 'support' | 'team';
    isCore: boolean;
    maxUsage?: number; // null for unlimited
    requiresSubscription: boolean;
}

export interface PlanFeatureAccess {
    planId: string;
    planName: string;
    features: string[];
    maxUsage: Record<string, number | null>;
}

export const AVAILABLE_FEATURES: PlanFeature[] = [
    // Analytics Features
    {
        id: 'basic_analytics',
        name: 'Basic Analytics Dashboard',
        description: 'Core trading performance metrics and charts',
        category: 'analytics',
        isCore: true,
        maxUsage: null,
        requiresSubscription: false
    },
    {
        id: 'advanced_analytics',
        name: 'Advanced Analytics Dashboard',
        description: 'Comprehensive trading analytics with detailed insights',
        category: 'analytics',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'trade_upload',
        name: 'Trade Data Upload',
        description: 'Upload and process trading data from various formats',
        category: 'trading',
        isCore: true,
        maxUsage: 100, // 100 trades per month for free
        requiresSubscription: false
    },
    {
        id: 'unlimited_upload',
        name: 'Unlimited Trade Upload',
        description: 'Unlimited trade data upload and processing',
        category: 'trading',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'pattern_analysis',
        name: 'Pattern Analysis',
        description: 'AI-powered trading pattern recognition',
        category: 'ai',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'behavioral_analysis',
        name: 'Behavioral Analysis',
        description: 'Trading behavior and psychology analysis',
        category: 'ai',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'risk_coaching',
        name: 'Risk Management Coaching',
        description: 'AI-powered risk management guidance',
        category: 'ai',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'live_monitoring',
        name: 'Real-time Trade Monitoring',
        description: 'Live position tracking and trade monitoring',
        category: 'monitoring',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'performance_goals',
        name: 'Performance Goal Setting',
        description: 'Set and track trading performance goals',
        category: 'trading',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'market_context',
        name: 'Market Context Integration',
        description: 'Market-aware analysis and insights',
        category: 'analytics',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'ai_chat',
        name: 'AI Chat Interface',
        description: 'Intelligent trading assistant with conversation history',
        category: 'ai',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'trade_validator',
        name: 'Trade Idea Validator',
        description: 'Validate trading ideas with AI analysis',
        category: 'ai',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'priority_support',
        name: 'Priority Email Support',
        description: 'Priority customer support response',
        category: 'support',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'team_management',
        name: 'Team Management',
        description: 'Manage team members and permissions',
        category: 'team',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'advanced_reporting',
        name: 'Advanced Reporting',
        description: 'Comprehensive reporting and analytics',
        category: 'analytics',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'api_access',
        name: 'API Access',
        description: 'Programmatic access to trading data and analytics',
        category: 'trading',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'custom_integrations',
        name: 'Custom Integrations',
        description: 'Custom integrations with external systems',
        category: 'trading',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'dedicated_support',
        name: 'Dedicated Support',
        description: 'Dedicated customer success manager',
        category: 'support',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'white_label',
        name: 'White-label Options',
        description: 'Custom branding and white-label solutions',
        category: 'team',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    },
    {
        id: 'advanced_security',
        name: 'Advanced Security Features',
        description: 'Enhanced security and compliance features',
        category: 'team',
        isCore: false,
        maxUsage: null,
        requiresSubscription: true
    }
];

export const PLAN_FEATURE_CONFIGS: Record<string, PlanFeatureAccess> = {
    'free': {
        planId: 'free',
        planName: 'Free',
        features: [
            'basic_analytics',
            'trade_upload'
        ],
        maxUsage: {
            'trade_upload': 100
        }
    },
    'pro': {
        planId: 'pro',
        planName: 'Pro',
        features: [
            'basic_analytics',
            'advanced_analytics',
            'unlimited_upload',
            'pattern_analysis',
            'behavioral_analysis',
            'risk_coaching',
            'live_monitoring',
            'performance_goals',
            'market_context',
            'ai_chat',
            'trade_validator',
            'priority_support'
        ],
        maxUsage: {
            'trade_upload': null,
            'pattern_analysis': null,
            'behavioral_analysis': null,
            'risk_coaching': null,
            'live_monitoring': null,
            'performance_goals': null,
            'market_context': null,
            'ai_chat': null,
            'trade_validator': null
        }
    },
    'enterprise': {
        planId: 'enterprise',
        planName: 'Enterprise',
        features: [
            'basic_analytics',
            'advanced_analytics',
            'unlimited_upload',
            'pattern_analysis',
            'behavioral_analysis',
            'risk_coaching',
            'live_monitoring',
            'performance_goals',
            'market_context',
            'ai_chat',
            'trade_validator',
            'priority_support',
            'team_management',
            'advanced_reporting',
            'api_access',
            'custom_integrations',
            'dedicated_support',
            'white_label',
            'advanced_security'
        ],
        maxUsage: {
            'trade_upload': null,
            'pattern_analysis': null,
            'behavioral_analysis': null,
            'risk_coaching': null,
            'live_monitoring': null,
            'performance_goals': null,
            'market_context': null,
            'ai_chat': null,
            'trade_validator': null,
            'team_management': null,
            'advanced_reporting': null,
            'api_access': null,
            'custom_integrations': null
        }
    }
};

export function getFeatureById(featureId: string): PlanFeature | undefined {
    return AVAILABLE_FEATURES.find(feature => feature.id === featureId);
}

export function getFeaturesByCategory(category: PlanFeature['category']): PlanFeature[] {
    return AVAILABLE_FEATURES.filter(feature => feature.category === category);
}

export function getPlanFeatures(planName: string): PlanFeature[] {
    const config = PLAN_FEATURE_CONFIGS[planName.toLowerCase()];
    if (!config) return [];

    return config.features
        .map(featureId => getFeatureById(featureId))
        .filter((feature): feature is PlanFeature => feature !== undefined);
}

export function hasFeatureAccess(planName: string, featureId: string): boolean {
    const config = PLAN_FEATURE_CONFIGS[planName.toLowerCase()];
    if (!config) return false;

    return config.features.includes(featureId);
}

export function getFeatureUsageLimit(planName: string, featureId: string): number | null {
    const config = PLAN_FEATURE_CONFIGS[planName.toLowerCase()];
    if (!config) return null;

    return config.maxUsage[featureId] || null;
}

export function comparePlans(planNames: string[]): {
    planName: string;
    features: PlanFeature[];
    missingFeatures: PlanFeature[];
}[] {
    return planNames.map(planName => {
        const planFeatures = getPlanFeatures(planName);
        const allFeatures = AVAILABLE_FEATURES.filter(f => !f.isCore);

        const missingFeatures = allFeatures.filter(feature =>
            !planFeatures.some(pf => pf.id === feature.id)
        );

        return {
            planName,
            features: planFeatures,
            missingFeatures
        };
    });
}
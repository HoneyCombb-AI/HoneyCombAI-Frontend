// ============================================================
// Overview / Dashboard domain types
// Extracted from: api/overview/route.ts
// ============================================================

export interface DashboardData {
    stats: {
        totalContacts: number;
        hotOpportunities: number;
        warmOpportunities: number;
        totalSignals: number;
        sociallyActive: number;
        analysisMetrics: {
            completed: number;
            pending: number;
        };
        tasksCompletedToday: number;
        emailsSentToday: number;
        totalEmailsSent: number;
        totalFollowUpEmailsSent: number;
        linkedinConnectsSent: number;
        linkedinMessagesSent: number;
        linkedinEngagementDone: number;
        linkedinConnectsToday: number;
        linkedinEngagementsToday: number;
        linkedinMessagesToday: number;
        totalUniqueContactsEngaged: number;
    };
    trends: {
        date: string;
        custom: number;
        system: number;
    }[];
    influence: {
        name: string;
        value: number;
    }[];
    socialMetrics: {
        momentum: number;
        engagement_style: {
            name: string;
            value: number;
        }[];
        activity_level: {
            name: string;
            value: number;
        }[];
        consistency: {
            name: string;
            value: number;
        }[];
        trend_direction: {
            name: string;
            value: number;
        }[];
    };
}

// ============================================================
// Overview / Dashboard domain types
// Extracted from: api/overview/route.ts
// ============================================================

export type OverviewStatType = 'emails_today' | 'linkedin_tasks_today' | 'connects_today' | 'messages_today';

export interface OverviewActivityItem {
    contact_id: string;
    contact_name: string;
    contact_email: string | null;
    contact_headline: string | null;
    contact_linkedin_url: string | null;
    profile_picture_url: string | null;
    company_name: string | null;
    activity_type: string;
    activity_detail: string | null;
    activity_time: string;
    sender_email: string | null;
}

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

// ============================================================
// Contacts domain types
// Extracted from: api/contacts/route.ts, api/contacts/[id]/route.ts,
//                 (dashboard)/contacts/page.tsx
// ============================================================

// --- List / Table types (from api/contacts/route.ts) ---

export interface MinimalCompany {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
}

export interface ContactSignal {
    id: string;
    signal_type: string;
    confidence_score: number;
    is_custom: boolean;
}

export interface ContactTag {
    id: string;
    name: string;
    color: string;
}

export interface DashboardContact {
    id: string;
    company_id: string;
    full_name: string;
    title: string | null;
    city: string | null;
    country: string | null;
    email: string | null;
    profile_picture: string | null;
    temperature: 'hot' | 'warm' | 'cold' | null;
    contact_sort_score: number | null;
    primaryAnalysisCompleted: boolean;
    primaryAnalysisRequested: boolean;
    hasNotes: boolean;
    company: MinimalCompany | null;
    signals: ContactSignal[];
    tags: ContactTag[];
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface CompanyGroupResponse {
    companies: Array<MinimalCompany & {
        contacts: DashboardContact[];
        contactCount: number;
    }>;
    pagination: PaginationInfo;
}

export interface LocationGroupResponse {
    locations: Record<string, {
        location: string;
        contacts: DashboardContact[];
        contactCount: number;
    }>;
    pagination: PaginationInfo;
}

export interface SearchResponse {
    contacts: DashboardContact[];
    pagination: PaginationInfo;
    searchTerm: string;
}

export interface TagGroupResponse {
    tags: Record<string, {
        tagName: string;
        color: string | null;
        contacts: DashboardContact[];
        contactCount: number;
    }>;
    pagination: PaginationInfo;
}

// --- Drawer types (from api/contacts/[id]/route.ts) ---

export interface DrawerContactSignal {
    id: string;
    signal_type: string;
    confidence_score: number;
    description: string | null;
    source: string | null;
    source_date: string | null;
    created_at: string;
    is_custom: boolean;
}

export interface DrawerAIAnalysis {
    id: string;
    created_at: string;
    confidence_score: number | null;
    confidence_reasoning: string | null;

    // Account Overview
    role: string | null;
    recent_developments: string[] | string | null;
    strategic_priorities: string[] | string | null;
    network: string | null;

    // Contact Insights
    contact_insights_summary: string | null;
    professional_interests: string | null;
    communication_style: string | null;
    decision_indicators: string | null;
    motivations_triggers: string | null;
    influence_level: string | null;

    // Why Reach Out
    buying_signals: string | null;
    engagement_hooks: string | null;
    timing_relevance: string | null;
    account_relevance: string | null;
    current_priorities: string | null;
    explicit_pain_points: string | null;

    // Legacy fields
    messaging_tone?: string | null;
    themes_to_use?: string | null;
}

export interface DrawerSocialActivity {
    activity_level: string;
    engagement_style: string;
    consistency: string;
    trend_direction: string;
    trend_change_percent: number;
    primary_active_days: string[] | string;
    best_time_window_utc: string;
    total_actions: number;
    avg_weekly_actions: number;
    outward_inward_ratio: number;
    weekend_activity_ratio: number;
    consistency_score: number;
    heatmap: Record<string, Record<string, number>>;
    forecasted_at: string;
}

export interface DrawerContact {
    id: string;
    full_name: string;
    title: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    profile_picture: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    twitter_handle: string | null;
    instagram_handle: string | null;
    languages: string[] | null;
    updated_at: string;

    primary_analysis_completed: boolean;
    primary_analysis_requested: boolean;
    temperature: 'hot' | 'warm' | 'cold' | null;
    signals: DrawerContactSignal[];

    ai_analysis: DrawerAIAnalysis[];
    social_activity: DrawerSocialActivity | null;
}

// --- Page-level types (from (dashboard)/contacts/page.tsx) ---

export type ContactsGroupByType = "none" | "company" | "location" | "city" | "tags";
export type ContactsLocationType = "country" | "city";
export type ContactsSortBy = "name" | "created_at" | "temperature" | "contact_sort_score" | string;
export type ContactsSortOrder = "asc" | "desc";

export type ContactsDashboardResponse =
    | CompanyGroupResponse
    | LocationGroupResponse
    | SearchResponse
    | TagGroupResponse;

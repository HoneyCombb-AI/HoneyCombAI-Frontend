// ============================================================
// Analytics domain types
// Extracted from: api/analytics/tracking/route.ts
// ============================================================

export interface PaginatedTrackingGroup {
    contact_id: string;
    contact_name: string;
    contact_email: string;
    contact_linkedin: string | null;
    subject: string;
    sent_at: string | null;
    position?: number;
    total_activity: number;
    latest_activity: string;
    unsubscribed: boolean;
    raw_events: {
        group_key: string;
        event_type: string;
        clicked_url: string | null;
        count: number;
        latest_activity: string;
        events: {
            event_id?: string;
            ip_address: string;
            location?: string | null;
            created_at: string;
        }[];
    }[] | null;
}

export interface CampaignListItem {
    id: string;
    name: string;
    status: string;
    created_at: string;
}

export interface CampaignContactStat {
    contact_id: string;
    contact_name: string;
    email: string;
    sent_at: string;
    step: number;
    opened: boolean;
    clicked: boolean;
    replied: boolean;
    bounced: boolean;
    unsubscribed: boolean;
}

export interface CampaignDrawerStats {
    campaign_name: string;
    campaign_status: string;
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    total_replied: number;
    total_bounced: number;
    total_unsubscribed: number;
    contacts: CampaignContactStat[];
}

export interface StepMetricDetail {
    step: number;
    open_count: number;
    click_count: number;
}

export interface CityGroup {
    city: string;
    parent_region?: string | null;
    parent_country?: string;
    total_open_count: number;
    total_click_count: number;
    step_metrics: StepMetricDetail[];
}

export interface RegionGroup {
    region: string;
    parent_country?: string;
    cities: string[];            // top-10 city names for display context
    total_open_count: number;
    total_click_count: number;
    step_metrics: StepMetricDetail[];
}

export interface CountryGroup {
    country: string;
    regions: string[];           // top-10 region names for display context
    cities: string[];            // top-10 city names for display context
    total_open_count: number;
    total_click_count: number;
    step_metrics: StepMetricDetail[];
}

export type GeolocationGroupItem = CountryGroup | RegionGroup | CityGroup;

export interface GeolocationPaginatedResponse {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    group_by: 'country' | 'region' | 'city';
    data: GeolocationGroupItem[];
}

export interface StepMetric {
    step: number;
    step_label: string;
    total_contacts: number;
    unique_opens: number;
    unique_clicks: number;
}

export interface StepContact {
    email_log_id: string;
    contact_id: string;
    contact_name: string;
    contact_email: string;
    contact_linkedin: string | null;
    subject: string;
    sent_at: string | null;
    position: number;
    unique_opens: number;
    unique_clicks: number;
    unsubscribed: boolean;
    bounced: boolean;
    raw_events: {
        group_key: string;
        event_type: string;
        clicked_url: string | null;
        count: number;
        latest_activity: string;
        events: {
            event_id?: string;
            ip_address: string;
            location?: string | null;
            created_at: string;
        }[];
    }[] | null;
}

export interface TrackingEvent {
    event_type: string;
    ip_address: string;
    location: string | null;
    clicked_url: string | null;
    created_at: string;
}

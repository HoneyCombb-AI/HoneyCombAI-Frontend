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
    total_activity: number;
    latest_activity: string;
    raw_events: {
        event_id: string;
        event_type: string;
        ip_address: string;
        clicked_url: string | null;
        created_at: string;
        location?: string | null;
    }[];
}

// ============================================================
// Emails domain types
// Extracted from: api/emails/route.ts,
//                 api/emails/[contactId]/messages/route.ts,
//                 api/emails/[contactId]/send/route.ts,
//                 api/emails/[contactId]/generate-draft/route.ts,
//                 api/emails/[contactId]/draft/route.ts
// ============================================================

// --- List types (from api/emails/route.ts) ---

export type EmailStatusFilter = "all" | "valid" | "invalid" | "risky" | "unknown";
export type EmailTemperatureFilter = "all" | "hot" | "warm" | "cold";

export interface OrgSender {
    user_id: string;
    display_name: string;
    email: string;
}

export type ContactEmail = {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    last_message_subject: string | null;
    last_interaction_at: string | null;
    // Pending draft fields
    draft_id: string | null;
    draft_subject: string | null;
    draft_body: string | null;
    draft_status: string | null;
    draft_position: number | null;
    // Email account ownership
    email_account_name: string | null;
    email_account_id: string | null;
    // Approval status (lightweight flags from RPC)
    has_pending_approval: boolean;
    has_rejected: boolean;
    rejection_reason: string | null;
    // Approval item details (loaded from messages endpoint)
    pending_approval_id?: string | null;
    pending_approval_subject?: string | null;
    pending_approval_body?: string | null;
};

export interface EmailsResponse {
    emails: ContactEmail[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// --- Message types (from api/emails/[contactId]/messages/route.ts) ---

export interface TrackingEvent {
    id: string;
    event_type: string;
    clicked_url: string | null;
    created_at: string;
}

export interface ContactMessage {
    id: string;
    account_id: string;
    status: string;
    subject: string;
    thread_id: string;
    message_id: string;
    campaign_id: string;
    contact_id: string;
    sent_at: string;
    direction: string;
    body: string;
    replied_at: string | null;
    open_count: number;
    click_count: number;
    tracking_events: TrackingEvent[];
}

export interface PendingApprovalItem {
    id: string;
    subject: string;
    body: string;
    submitted_at: string;
}

export interface RejectedApprovalItem {
    id: string;
    subject: string;
    body: string;
    rejection_reason: string | null;
    reviewed_at: string | null;
}

export interface MessagesResponse {
    messages: ContactMessage[];
    contact_id: string;
    pending_approval?: PendingApprovalItem | null;
    rejected_approval?: RejectedApprovalItem | null;
}

// --- Send email (from api/emails/[contactId]/send/route.ts) ---

export interface SendEmailRequest {
    subject: string;
    body: string;
    account_id: string;
    account_provider: "gmail" | "outlook";
    thread_id?: string;
    reply_to_message_id?: string;
}

export interface SendEmailResponse {
    status: string;
    message_id: string;
}

// --- Draft (from api/emails/[contactId]/generate-draft/route.ts) ---

export interface DraftResponse {
    subject: string;
    body: string;
}

// --- Update draft (from api/emails/[contactId]/draft/route.ts) ---

export interface UpdateDraftRequest {
    draft_id: string;
    subject?: string;
    body?: string;
}

// ============================================================
// Emails domain types
// ============================================================

export type EmailStatusFilter = "all" | "valid" | "invalid" | "risky" | "unknown";
export type EmailTemperatureFilter = "all" | "hot" | "warm" | "cold";

export interface OrgSender {
    user_id: string;
    display_name: string;
    email: string;
}

// --- List (get_email_view_contacts RPC) ---

export type ContactEmail = {
    id: string;
    full_name: string;
    last_message_subject: string | null;
    last_interaction_at: string | null;
    email_account_id: string | null;
    has_pending_approval: boolean;
    has_rejected: boolean;
    has_draft: boolean;
};

export interface EmailsResponse {
    emails: ContactEmail[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// --- Contact email addresses (contact_emails table) ---

export interface ContactEmailAddress {
    id: string;
    email: string;
    is_primary: boolean;
    label: string | null;
}

// --- Messages (get_contact_messages RPC) ---

export interface ContactMessage {
    id: string;
    subject: string;
    body: string;
    direction: string;
    status: string;
    sent_at: string;
    replied_at: string | null;
    message_id: string;
    thread_id: string | null;
    sender_name: string;
    sender_email: string | null;
    contact_email: string | null;
    cc?: string[] | null;
}

export interface MessageThread {
    thread_id: string | null;
    subject: string;
    message_count: number;
    first_sent_at: string;
    last_sent_at: string;
    messages: ContactMessage[];
}

export interface PendingDraftItem {
    id: string;
    subject: string;
    body: string;
    position: number | null;
    status: string;
    email_account_name: string | null;
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
    threads: MessageThread[];
    contact_id: string;
    contact_emails: ContactEmailAddress[];
    draft?: PendingDraftItem | null;
    pending_approval?: PendingApprovalItem | null;
    rejected_approval?: RejectedApprovalItem | null;
}

// --- Send email ---

export interface SendEmailRequest {
    subject: string;
    body: string;
    account_id: string;
    account_provider: "gmail" | "outlook";
    thread_id?: string;
    reply_to_message_id?: string;
    to_email?: string;
    cc?: string[];
}

export interface SendEmailResponse {
    status: string;
    message_id: string;
}

// --- Draft ---

export interface DraftResponse {
    subject: string;
    body: string;
}

export interface UpdateDraftRequest {
    draft_id: string;
    subject?: string;
    body?: string;
}

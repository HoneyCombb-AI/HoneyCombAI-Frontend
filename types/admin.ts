// ============================================================
// Admin & Approval domain types
// ============================================================

export type ApprovalItemType =
    | 'email_draft'
    | 'manual_email'
    | 'linkedin_task'
    | 'manual_linkedin';

export interface EmailSnapshot {
    subject: string;
    body: string;
    contact_name: string;
    contact_email: string;
    company_name: string;
    account_id: string;
    account_provider: 'gmail' | 'outlook';
    thread_id?: string;
    reply_to_message_id?: string;
}

export interface LinkedInSnapshot {
    task_type: string;
    draft_message?: string;
    connection_note?: string;
    target_linkedin_url?: string;
    target_name: string;
    contact_name: string;
    company_name: string;
    post_url?: string;
}

export interface ApprovalItem {
    id: string;
    organization_id: string;
    item_type: ApprovalItemType;
    item_id: string | null;
    contact_id: string | null;
    submitted_by: string;
    submitted_by_name: string;
    submitted_at: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    snapshot: EmailSnapshot | LinkedInSnapshot;
    contact_name: string | null;
    company_name: string | null;
}

export interface ApprovalsResponse {
    items: ApprovalItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

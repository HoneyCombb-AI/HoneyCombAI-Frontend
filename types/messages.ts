// ============================================================
// LinkedIn Messages domain types
// Extracted from: api/messages/route.ts,
//                 api/messages/[contactId]/route.ts,
//                 api/messages/[contactId]/task/route.ts
// ============================================================

// --- Contact list (from api/messages/route.ts) ---

export type LinkedInContact = {
    id: string;
    full_name: string;
    current_company: string;
    company_name: string;
    is_connected: boolean;
    conversation_started: boolean;
    reply_received: boolean;
    meeting_booked: boolean;
    automation_enabled: boolean;
    strategy: string;
    // Pending task fields (from get_linkedin_contacts RPC)
    task_id: string | null;
    task_type: string | null;
    task_status: string | null;
    draft_message: string | null;
    connection_note: string | null;
    scheduled_at: string | null;
    // LinkedIn account ownership
    linkedin_account_name: string | null;
    linkedin_account_id: string | null;
    // Multiple pending tasks support
    pending_task_count: number;
    other_pending_tasks: { task_type: string; scheduled_at: string | null; task_id: string }[];
};

export interface LinkedInContactsResponse {
    contacts: LinkedInContact[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// --- Conversation (from api/messages/[contactId]/route.ts) ---

export interface LinkedInMessage {
    id: string;
    content: string | null;
    sender_type: string;
    status: string;
    created_at: string;
    timestamp: string | null;
    message_type: string;
}

export interface LinkedInConversationResponse {
    messages: LinkedInMessage[];
    contact_id: string;
}

// --- Task update (from api/messages/[contactId]/task/route.ts) ---

export interface UpdateTaskRequest {
    task_id: string;
    draft_message?: string;
    connection_note?: string;
}

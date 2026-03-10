// ============================================================
// Organization domain types
// Extracted from: api/organization/route.ts
// ============================================================

export interface OrganizationMember {
    id: string;
    user_id: string;
    joined_at: string;
    full_name: string;
    token_limit: number | null;
    tokens_used: number;
}

export interface OrganizationData {
    id: string;
    name: string;
    invite_code: string;
    created_by: string;
    created_at: string;
    total_tokens: number;
    members: OrganizationMember[];
    memberCount: number;
    isOwner: boolean;
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ContactEmail, EmailsResponse } from '@/types/emails';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const tagsParam = searchParams.get('tags');
        const tags = tagsParam ? tagsParam.split(',') : null;
        const hasReplyParam = searchParams.get('hasReply');
        const hasReply = hasReplyParam === 'true' ? true : null;
        const userId = searchParams.get('userId') || null;
        const showRejectedParam = searchParams.get('showRejected');
        const showRejected = showRejectedParam === 'true' ? true : null;

        // Get authenticated user to fetch their organization
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization from profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.organization_id) {
            return NextResponse.json(
                { error: 'Organization not found for user' },
                { status: 404 }
            );
        }

        const organizationId = profile.organization_id;

        // Call RPC function
        const { data, error } = await supabase.rpc('get_email_view_contacts', {
            p_org_id: organizationId,
            p_page: page,
            p_limit: limit,
            p_search: search,
            p_tag_names: tags,
            p_has_reply: hasReply,
            p_user_id: userId,
            p_show_rejected: showRejected,
        });

        if (error) {
            console.error('RPC Error:', error);
            return NextResponse.json(
                { error: `Failed to load contacts: ${error.message}` },
                { status: 500 }
            );
        }

        const emails = data as ContactEmail[];
        const total = emails.length > 0 ? Number((emails[0] as any).total_count) : 0;
        const hasMore = (page * limit) < total;

        const normalizedEmails = emails.map((e: any) => ({
            ...e,
            last_message_subject: e.last_message_subject ?? null,
            last_interaction_at: e.last_interaction_at ?? null,
            draft_id: e.draft_id ?? null,
            draft_subject: e.draft_subject ?? null,
            draft_body: e.draft_body ?? null,
            draft_status: e.draft_status ?? null,
            draft_position: e.draft_position ?? null,
            email_account_name: e.email_account_name ?? null,
            email_account_id: e.email_account_id ?? null,
            has_pending_approval: e.has_pending_approval ?? false,
            has_rejected: e.has_rejected ?? false,
            rejection_reason: e.rejection_reason ?? null,
        }));

        const response: EmailsResponse = {
            emails: normalizedEmails,
            total,
            page,
            limit,
            hasMore
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error('API /api/emails error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

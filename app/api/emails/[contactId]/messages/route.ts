import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TrackingEvent, ContactMessage, MessagesResponse } from '@/types/emails';

type ContactRow = {
    id: string;
    user_id: string | null;
    companies?: { organization_id: string | null } | { organization_id: string | null }[] | null;
};

type EmailLogRow = {
    id: string;
    gmail_account_id: string | null;
    outlook_account_id: string | null;
    status: string | null;
    subject: string | null;
    thread_id: string | null;
    message_id: string | null;
    campaign_id: string | null;
    contact_id: string;
    sent_at: string;
    direction: string | null;
    body: string | null;
    replied_at: string | null;
    email_tracking_events: TrackingEvent[];
};

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found for user' }, { status: 404 });
        }

        const organizationId = profile.organization_id;

        const { data: orgMembers, error: membersError } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', organizationId);

        if (membersError) {
            return NextResponse.json(
                { error: 'Failed to load organization members' },
                { status: 500 }
            );
        }

        const memberIds = (orgMembers || [])
            .map((member) => member.user_id)
            .filter((id): id is string => !!id);

        const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('id, user_id, companies:company_id (organization_id)')
            .eq('id', contactId)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const contactRow = contact as ContactRow;
        const companyOrgId = Array.isArray(contactRow.companies)
            ? contactRow.companies[0]?.organization_id
            : contactRow.companies?.organization_id;

        const inOrganization =
            companyOrgId === organizationId ||
            (contactRow.user_id && memberIds.includes(contactRow.user_id));

        if (!inOrganization) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: emailLogs, error: logsError } = await supabase
            .from('email_logs')
            .select(
                'id, gmail_account_id, outlook_account_id, status, subject, thread_id, message_id, ' +
                'campaign_id, contact_id, sent_at, direction, body, replied_at, ' +
                'email_tracking_events(id, event_type, clicked_url, created_at)'
            )
            .eq('contact_id', contactId)
            .order('sent_at', { ascending: true });

        if (logsError) {
            return NextResponse.json(
                { error: `Failed to load messages: ${logsError.message}` },
                { status: 500 }
            );
        }

        const logs = (emailLogs || []) as unknown as EmailLogRow[];
        const messages: ContactMessage[] = logs.map((log) => {
            const events = log.email_tracking_events || [];
            return {
                id: log.id,
                account_id: log.gmail_account_id || log.outlook_account_id || '',
                status: log.status || '',
                subject: log.subject || '',
                thread_id: log.thread_id || '',
                message_id: log.message_id || '',
                campaign_id: log.campaign_id || '',
                contact_id: log.contact_id,
                sent_at: log.sent_at,
                direction: log.direction || 'outbound',
                body: log.body || '',
                replied_at: log.replied_at,
                open_count: events.filter(e => e.event_type === 'open').length,
                click_count: events.filter(e => e.event_type === 'click').length,
                tracking_events: events,
            };
        });

        const result: MessagesResponse = {
            messages,
            contact_id: contactId,
        };

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error(`API /api/emails messages error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

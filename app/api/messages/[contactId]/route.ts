import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LinkedInMessage, LinkedInConversationResponse } from '@/types/messages';

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

        // --- Organization membership check (mirrors email route) ---
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

        const companies = (contact as { companies?: { organization_id: string | null } | { organization_id: string | null }[] | null }).companies;
        const companyOrgId = Array.isArray(companies)
            ? companies[0]?.organization_id
            : companies?.organization_id;

        const inOrganization =
            companyOrgId === organizationId ||
            ((contact as { user_id?: string | null }).user_id && memberIds.includes((contact as { user_id?: string | null }).user_id!));

        if (!inOrganization) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // --- End org check ---

        const { data, error } = await supabase.rpc('get_linkedin_conversation', {
            p_user_id: user.id,
            p_contact_id: contactId,
        });

        if (error) {
            console.error('RPC Error:', error);
            return NextResponse.json(
                { error: `Failed to load messages: ${error.message}` },
                { status: 500 }
            );
        }

        const result: LinkedInConversationResponse = {
            messages: (data || []) as LinkedInMessage[],
            contact_id: contactId,
        };

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error('API /api/messages/[contactId] error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

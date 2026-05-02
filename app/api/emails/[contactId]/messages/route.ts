import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MessagesResponse } from '@/types/emails';

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

        const { data, error } = await supabase.rpc('get_contact_messages', {
            p_contact_id: contactId,
            p_org_id: profile.organization_id,
        });

        if (error) {
            console.error('get_contact_messages RPC error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const result = data as any;

        if (result?.error === 'forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const response: MessagesResponse = {
            threads: result.threads ?? [],
            contact_id: contactId,
            contact_emails: result.contact_emails ?? [],
            draft: result.draft ?? null,
            pending_approval: result.pending_approval ?? null,
            rejected_approval: result.rejected_approval ?? null,
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error('API /api/emails messages error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

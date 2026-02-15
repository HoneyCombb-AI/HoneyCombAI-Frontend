import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

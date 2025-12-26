import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface SenderDetails {
    full_name: string;
    avatar_url: string | null;
}

export interface ConversationMessage {
    id: string;
    content: string | null;
    status: string;
    sender_type: string;
    created_at: string;
    timestamp: string | null;
    sender_details: SenderDetails | null;
}

export async function GET(
    request: Request,
    props: { params: Promise<{ contactId: string }> }
) {
    try {
        const params = await props.params;
        const { contactId } = params;
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_contact_conversation', {
            p_contact_id: contactId
        });

        if (error) {
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversation' },
            { status: 500 }
        );
    }
}

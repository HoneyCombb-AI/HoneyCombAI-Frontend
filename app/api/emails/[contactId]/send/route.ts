import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

export interface SendEmailRequest {
    subject: string;
    body: string;
    thread_id?: string;
    reply_to_message_id?: string;
}

export interface SendEmailResponse {
    status: string;
    message_id: string;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;
        const body: SendEmailRequest = await req.json();

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's Gmail or Outlook account ID (prefer Gmail)
        const { data: gmailAccount } = await supabase
            .from('gmail_accounts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: outlookAccount } = await supabase
            .from('outlook_accounts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        const accountId = gmailAccount?.id || outlookAccount?.id;

        if (!accountId) {
            return NextResponse.json(
                { detail: 'No available account to send email from.' },
                { status: 400 }
            );
        }

        // Call remote mail server API to send email
        const response = await axios.post(
            `${MAIL_SERVER_URL}/contacts/${contactId}/email`,
            {
                subject: body.subject,
                body: body.body,
                account_id: accountId,
                thread_id: body.thread_id,
                reply_to_message_id: body.reply_to_message_id,
            },
            {
                auth: {
                    username: MAIL_SERVER_USER,
                    password: MAIL_SERVER_PASSWORD,
                },
            }
        );

        const result: SendEmailResponse = response.data;

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error(`API send email error:`, error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    detail: error.response?.data?.detail || 'Provider failed to send email',
                },
                { status: error.response?.status || 500 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { detail: errorMessage },
            { status: 500 }
        );
    }
}

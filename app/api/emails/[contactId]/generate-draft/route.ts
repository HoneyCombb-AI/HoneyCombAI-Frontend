import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import axios from 'axios';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

export interface DraftResponse {
    subject: string;
    body: string;
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: gmailAccount } = await supabase
            .from("gmail_accounts")
            .select("id, is_connected, access_token, refresh_token")
            .eq("user_id", user.id)
            .maybeSingle();

        const gmailConnected = !!gmailAccount?.is_connected &&
            (!!gmailAccount?.refresh_token || !!gmailAccount?.access_token);

        let isConnected = gmailConnected;

        if (!isConnected) {
            const { data: outlookAccount } = await supabase
                .from("outlook_accounts")
                .select("id, is_connected, access_token, refresh_token")
                .eq("user_id", user.id)
                .maybeSingle();

            const outlookConnected = !!outlookAccount?.is_connected &&
                (!!outlookAccount?.refresh_token || !!outlookAccount?.access_token);

            isConnected = outlookConnected;
        }

        if (!isConnected) {
            return NextResponse.json(
                { detail: "No connected email account." },
                { status: 403 }
            );
        }

        const rateLimit = await rateLimiters.aiDraftPerUser(user.id);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    remaining: rateLimit.remaining,
                    resetTime: rateLimit.resetTime,
                },
                { status: 429 }
            );
        }

        // Call remote mail server API to generate draft
        const response = await axios.post(
            `${MAIL_SERVER_URL}/emails/contact/${contactId}/generate-draft`,
            {},
            {
                auth: {
                    username: MAIL_SERVER_USER,
                    password: MAIL_SERVER_PASSWORD,
                },
            }
        );

        const draft: DraftResponse = response.data;

        return NextResponse.json(draft);

    } catch (error: unknown) {
        console.error(`API generate-draft error:`, error);

        if (axios.isAxiosError(error)) {
            // Even on error, the API returns a draft with error message
            if (error.response?.data) {
                return NextResponse.json(error.response.data, {
                    status: error.response?.status || 500,
                });
            }

            return NextResponse.json(
                {
                    subject: 'Error',
                    body: `<p>Error generating draft: ${error.message}</p>`,
                },
                { status: error.response?.status || 500 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            {
                subject: 'Error',
                body: `<p>Error generating draft: ${errorMessage}</p>`,
            },
            { status: 500 }
        );
    }
}

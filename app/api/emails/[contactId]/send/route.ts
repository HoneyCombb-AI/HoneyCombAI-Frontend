import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';
import type { SendEmailRequest, SendEmailResponse } from '@/types/emails';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

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

        if (!body?.subject || !body?.body || !body?.account_id || !body?.account_provider) {
            return NextResponse.json(
                { detail: 'Missing required fields.' },
                { status: 400 }
            );
        }

        if (body.account_provider !== "gmail" && body.account_provider !== "outlook") {
            return NextResponse.json(
                { detail: 'Invalid account provider.' },
                { status: 400 }
            );
        }

        const accountTable = body.account_provider === "gmail" ? "gmail_accounts" : "outlook_accounts";
        const { data: account, error: accountError } = await supabase
            .from(accountTable)
            .select('id, is_connected, access_token, refresh_token')
            .eq('id', body.account_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (accountError || !account?.id) {
            return NextResponse.json(
                { detail: 'Invalid account for user.' },
                { status: 403 }
            );
        }

        const hasToken = !!account.refresh_token || !!account.access_token;
        if (!account.is_connected || !hasToken) {
            return NextResponse.json(
                { detail: 'Account is disconnected.' },
                { status: 403 }
            );
        }

        // --- Approval gate ---
        // Check if org requires approval and user is not admin
        const { data: profile } = await supabase
            .from('organization_members')
            .select('role, organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profile?.organization_id) {
            const { data: org } = await supabase
                .from('organizations')
                .select('approval_required')
                .eq('id', profile.organization_id)
                .single();

            if (org?.approval_required && profile.role !== 'admin') {
                // Get contact info for the snapshot
                const { data: contact } = await supabase
                    .from('contacts')
                    .select('full_name, email, company:companies(name)')
                    .eq('id', contactId)
                    .maybeSingle();

                await supabase.from('approval_queue').insert({
                    organization_id: profile.organization_id,
                    item_type: 'manual_email',
                    submitted_by: user.id,
                    contact_id: contactId,
                    snapshot: {
                        subject: body.subject,
                        body: body.body,
                        account_id: body.account_id,
                        account_provider: body.account_provider,
                        thread_id: body.thread_id || null,
                        reply_to_message_id: body.reply_to_message_id || null,
                        contact_email: contact?.email || '',
                        contact_name: contact?.full_name || '',
                        company_name: ((contact?.company as unknown as { name: string } | null)?.name) || '',
                    },
                });

                return NextResponse.json({
                    status: 'queued_for_approval',
                    message: 'Email submitted for admin approval',
                });
            }
        }
        const response = await axios.post(
            `${MAIL_SERVER_URL}/emails/contact/${contactId}/send`,
            {
                subject: body.subject,
                body: body.body,
                account_id: body.account_id,
                account_provider: body.account_provider,
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

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

        if (!body?.subject || !body?.body || !body?.account_id || !body?.account_provider || !body?.contact_email_id) {
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

        const { data: selectedContactEmail, error: selectedContactEmailError } = await supabase
            .from('contact_emails')
            .select('id, email')
            .eq('id', body.contact_email_id)
            .eq('contact_id', contactId)
            .maybeSingle();

        if (selectedContactEmailError) {
            console.error('Failed to validate selected contact email:', selectedContactEmailError);
            return NextResponse.json(
                { detail: 'Failed to validate recipient email.' },
                { status: 500 }
            );
        }

        if (!selectedContactEmail) {
            return NextResponse.json(
                { detail: 'Selected recipient email does not belong to this contact.' },
                { status: 400 }
            );
        }

        // --- Approval gate ---
        // Check if org requires approval and user is not admin
        const { data: profile, error: profileError } = await supabase
            .from('organization_members')
            .select('role, organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileError) {
            console.error('Failed to fetch user membership for approval gate:', profileError);
            return NextResponse.json(
                { detail: 'Failed to evaluate approval requirements' },
                { status: 500 }
            );
        }

        if (profile?.organization_id) {
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('approval_required')
                .eq('id', profile.organization_id)
                .single();

            if (orgError || !org) {
                console.error('Failed to fetch organization settings for approval gate:', orgError);
                return NextResponse.json(
                    { detail: 'Failed to evaluate approval requirements' },
                    { status: 500 }
                );
            }

            if (org.approval_required && profile.role !== 'admin') {
                // Get contact info for the snapshot
                const { data: contact, error: contactError } = await supabase
                    .from('contacts')
                    .select('full_name, company:companies(name)')
                    .eq('id', contactId)
                    .maybeSingle();

                if (contactError) {
                    console.error('Failed to fetch contact for approval snapshot:', contactError);
                    return NextResponse.json(
                        { detail: 'Failed to fetch contact details' },
                        { status: 500 }
                    );
                }

                const { error: insertError } = await supabase.from('approval_queue').insert({
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
                        contact_email_id: selectedContactEmail.id,
                        contact_email: selectedContactEmail.email,
                        contact_name: contact?.full_name || '',
                        company_name: ((contact?.company as unknown as { name: string } | null)?.name) || '',
                        cc: body.cc?.length ? body.cc : undefined,
                        bcc: body.bcc?.length ? body.bcc : undefined,
                    },
                });

                if (insertError) {
                    console.error('Failed to insert approval queue item:', insertError);
                    return NextResponse.json(
                        { detail: 'Failed to submit email for approval' },
                        { status: 500 }
                    );
                }

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
                ...(body.thread_id && { thread_id: body.thread_id }),
                ...(body.reply_to_message_id && { reply_to_message_id: body.reply_to_message_id }),
                contact_email_id: selectedContactEmail.id,
                contact_email: selectedContactEmail.email,
                ...(body.cc?.length ? { cc: body.cc } : {}),
                ...(body.bcc?.length ? { bcc: body.bcc } : {}),
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

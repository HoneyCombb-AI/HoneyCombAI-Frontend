import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ReviewActionPayload, ReviewApprovalRPCResponse, EmailSnapshot } from '@/types/admin';
import axios from 'axios';

const MAIL_SERVER_URL = process.env.MAIL_SERVER_URL || 'https://mail.honeycombai.in';
const MAIL_SERVER_USER = process.env.MAIL_SERVER_USER || '';
const MAIL_SERVER_PASSWORD = process.env.MAIL_SERVER_PASSWORD || '';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase.rpc('get_approval_detail', {
            p_user_id: user.id,
            p_item_id: id,
        });

        if (error) {
            console.error('Error in get_approval_detail RPC:', error);
            return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 });
        }
        if (data?.error === 'forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (data?.error === 'not_found') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Error fetching approval detail:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json() as ReviewActionPayload;
        const { action, snapshot: editedSnapshot, rejection_reason } = body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Action must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        // For manual_email approvals: send the email BEFORE persisting the approval
        // so the item remains retryable if dispatch fails.
        if (action === 'approve') {
            const { data: item, error: peekError } = await supabase
                .from('approval_queue')
                .select('item_type, contact_id, snapshot')
                .eq('id', id)
                .single();

            if (peekError) {
                console.error('Failed to fetch approval item for pre-send check:', peekError);
                return NextResponse.json({ error: 'Failed to fetch approval item' }, { status: 500 });
            }

            if (item?.item_type === 'manual_email') {
                const snapshot = (editedSnapshot || item.snapshot) as EmailSnapshot | undefined;

                if (!item.contact_id || !snapshot?.subject || !snapshot?.body) {
                    return NextResponse.json(
                        { error: 'Missing contact or email content' },
                        { status: 422 }
                    );
                }

                try {
                    await axios.post(
                        `${MAIL_SERVER_URL}/emails/contact/${item.contact_id}/send`,
                        {
                            subject: snapshot.subject,
                            body: snapshot.body,
                            account_id: snapshot.account_id,
                            account_provider: snapshot.account_provider,
                            thread_id: snapshot.thread_id,
                            reply_to_message_id: snapshot.reply_to_message_id,
                            contact_email: snapshot.contact_email,
                            cc: snapshot.cc?.length ? snapshot.cc : undefined,
                        },
                        {
                            auth: {
                                username: MAIL_SERVER_USER,
                                password: MAIL_SERVER_PASSWORD,
                            },
                        }
                    );
                } catch (mailError: unknown) {
                    console.error('Mail dispatch failed; approval not persisted:', mailError);
                    if (axios.isAxiosError(mailError)) {
                        return NextResponse.json(
                            { error: mailError.response?.data?.detail || 'Email dispatch failed. Approval not saved.' },
                            { status: mailError.response?.status || 502 }
                        );
                    }
                    return NextResponse.json(
                        { error: 'Email dispatch failed. Approval not saved.' },
                        { status: 502 }
                    );
                }
            }
        }

        // Single RPC call — admin check, fetch, lock, update, flip linked items
        const { data, error } = await supabase.rpc('review_approval_item', {
            p_user_id: user.id,
            p_item_id: id,
            p_action: action,
            p_rejection_reason: rejection_reason || null,
            p_snapshot: editedSnapshot || null,
        }) as { data: ReviewApprovalRPCResponse | null; error: unknown };

        if (error) {
            console.error('Error in review_approval_item RPC:', error);
            return NextResponse.json(
                { error: 'Failed to process approval' },
                { status: 500 }
            );
        }

        // Handle RPC-level errors
        if (data?.error === 'forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (data?.error === 'not_found') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        if (data?.error === 'already_reviewed') {
            return NextResponse.json({ error: 'Item has already been reviewed' }, { status: 400 });
        }
        if (data?.error === 'invalid_action') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Unexpected empty response' }, { status: 500 });
        }

        // For rejections, insert notification for submitter
        if (action === 'reject') {
            const contactName = data.snapshot?.contact_name || 'a contact';
            const notifText = rejection_reason
                ? `Your email to ${contactName} was rejected by admin. Reason: "${rejection_reason}"`
                : `Your email to ${contactName} was rejected by admin.`;

            await supabase.from('notifications').insert({
                user_id: data.submitted_by,
                type: 'approval_rejected',
                text: notifText,
                batch_id: `approval_${id}`,
            });
        }

        return NextResponse.json({ status: data.status });

    } catch (error: unknown) {
        console.error('Error processing approval:', error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: error.response?.data?.detail || 'Failed to execute approved action' },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

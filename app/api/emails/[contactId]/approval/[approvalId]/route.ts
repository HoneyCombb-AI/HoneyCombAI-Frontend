import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ contactId: string; approvalId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { contactId, approvalId } = await params;
        const body = await req.json() as {
            subject: string;
            body: string;
            contact_email_id?: string;
            contact_email?: string;
            cc?: string[];
            bcc?: string[];
        };

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: existing, error: fetchError } = await supabase
            .from('approval_queue')
            .select('id, snapshot, submitted_by, contact_id')
            .eq('id', approvalId)
            .eq('contact_id', contactId)
            .eq('status', 'rejected')
            .maybeSingle();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (existing.submitted_by !== user.id) {
            return NextResponse.json({ error: 'Only the original submitter can resubmit this email.' }, { status: 403 });
        }

        if (!body.contact_email_id) {
            return NextResponse.json({ error: 'contact_email_id is required' }, { status: 400 });
        }

        const { data: selectedContactEmail, error: selectedContactEmailError } = await supabase
            .from('contact_emails')
            .select('id, email')
            .eq('id', body.contact_email_id)
            .eq('contact_id', contactId)
            .maybeSingle();

        if (selectedContactEmailError) {
            console.error('Failed to validate selected contact email:', selectedContactEmailError);
            return NextResponse.json({ error: 'Failed to validate recipient email' }, { status: 500 });
        }

        if (!selectedContactEmail) {
            return NextResponse.json({ error: 'Selected recipient email does not belong to this contact' }, { status: 400 });
        }

        const updatedSnapshot = {
            ...(existing.snapshot as Record<string, unknown>),
            subject: body.subject,
            body: body.body,
            contact_email_id: selectedContactEmail.id,
            contact_email: selectedContactEmail.email,
            cc: body.cc?.length ? body.cc : undefined,
            bcc: body.bcc?.length ? body.bcc : undefined,
        };

        const { data: updated, error: updateError } = await supabase
            .from('approval_queue')
            .update({
                status: 'pending',
                snapshot: updatedSnapshot,
                rejection_reason: null,
                reviewed_at: null,
                reviewed_by: null,
                submitted_at: new Date().toISOString(),
            })
            .eq('id', approvalId)
            .eq('contact_id', contactId)
            .eq('submitted_by', user.id)
            .eq('status', 'rejected')
            .select('id');

        if (updateError) {
            console.error('Failed to resubmit approval:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (!updated || updated.length === 0) {
            return NextResponse.json({ error: 'Approval is no longer in rejected state' }, { status: 409 });
        }

        return NextResponse.json({ status: 'resubmitted' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { contactId, approvalId } = await params;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: deleted, error: deleteError } = await supabase
            .from('approval_queue')
            .delete()
            .eq('id', approvalId)
            .eq('contact_id', contactId)
            .eq('submitted_by', user.id)
            .select('id');

        if (deleteError) {
            console.error('Failed to discard approval:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        if (!deleted || deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ status: 'discarded' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

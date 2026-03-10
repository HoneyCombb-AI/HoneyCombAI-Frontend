import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateDraftRequest } from '@/types/emails';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;
        const body = (await req.json()) as UpdateDraftRequest;
        const { draft_id, subject, body: draftBody } = body;

        if (!draft_id) {
            return NextResponse.json({ error: 'draft_id is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile lookup error:', profileError);
            return NextResponse.json({ error: 'Failed to load organization context' }, { status: 500 });
        }
        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // Verify the draft exists, is pending, and belongs to this contact
        const { data: existingDraft, error: fetchError } = await supabase
            .from('email_drafts')
            .select('id, status, contact_id, campaign_id')
            .eq('id', draft_id)
            .single();

        if (fetchError || !existingDraft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        if (existingDraft.contact_id !== contactId) {
            return NextResponse.json({ error: 'Draft does not belong to this contact' }, { status: 400 });
        }

        if (existingDraft.status !== 'pending') {
            return NextResponse.json({ error: 'Only pending drafts can be edited' }, { status: 400 });
        }

        // Verify the campaign belongs to the user's organization
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('organization_id')
            .eq('id', existingDraft.campaign_id)
            .single();

        if (campaignError) {
            console.error('Campaign lookup error:', campaignError);
            return NextResponse.json({ error: 'Failed to validate campaign ownership' }, { status: 500 });
        }
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        if (campaign.organization_id !== profile.organization_id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build update payload
        const updatePayload: Record<string, string> = {};
        if (subject !== undefined) {
            updatePayload.subject = subject;
        }
        if (draftBody !== undefined) {
            updatePayload.body = draftBody;
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: updated, error: updateError } = await supabase
            .from('email_drafts')
            .update(updatePayload)
            .eq('id', draft_id)
            .eq('contact_id', contactId)
            .eq('status', 'pending')
            .eq('campaign_id', existingDraft.campaign_id)
            .select('id, subject, body, status, position')
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: `Failed to update draft: ${updateError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ draft: updated });

    } catch (error: unknown) {
        console.error('API PATCH /api/emails/[contactId]/draft error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

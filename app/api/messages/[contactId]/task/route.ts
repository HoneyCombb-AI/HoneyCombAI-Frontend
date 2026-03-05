import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface UpdateTaskRequest {
    task_id: string;
    draft_message?: string;
    connection_note?: string;
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;
        const body = (await req.json()) as UpdateTaskRequest;
        const { task_id, draft_message, connection_note } = body;

        if (!task_id) {
            return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: existingTask, error: fetchError } = await supabase
            .from('linkedin_tasks')
            .select('id, status, contact_id, user_id')
            .eq('id', task_id)
            .maybeSingle();

        if (fetchError) {
            console.error('Task lookup error:', fetchError.message);
            return NextResponse.json({ error: 'Task lookup failed' }, { status: 500 });
        }

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (existingTask.contact_id !== contactId) {
            return NextResponse.json({ error: 'Task does not belong to this contact' }, { status: 400 });
        }

        if (existingTask.status !== 'PENDING') {
            return NextResponse.json({ error: 'Only PENDING tasks can be edited' }, { status: 400 });
        }

        // Build update payload — only update fields that were provided
        const updatePayload: Record<string, string> = {};
        if (draft_message !== undefined) {
            updatePayload.draft_message = draft_message;
        }
        if (connection_note !== undefined) {
            updatePayload.connection_note = connection_note;
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: updated, error: updateError } = await supabase
            .from('linkedin_tasks')
            .update(updatePayload)
            .eq('id', task_id)
            .select('id, task_type, draft_message, connection_note, scheduled_at, status')
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: `Failed to update task: ${updateError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ task: updated });

    } catch (error: unknown) {
        console.error('API PATCH /api/messages/[contactId]/task error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

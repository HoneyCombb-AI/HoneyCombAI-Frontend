import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface DeleteNoteRequest {
  id: string;
}

interface DeleteNoteResponse {
  success: boolean;
  error?: string;
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rateLimit = await rateLimiters.TANPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delete rate limit exceeded. Please wait before deleting more notes.'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const body: DeleteNoteRequest = await req.json();

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'id is required and must be a valid string' },
        { status: 400 }
      );
    }

    // Check ownership before deleting
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('id, created_by')
      .eq('id', body.id)
      .single();

    if (fetchError || !existingNote) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    if (existingNote.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own notes' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', body.id);

    if (deleteError) {
      console.error('Error deleting note:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    const response: DeleteNoteResponse = { success: true };
    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/notes/delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

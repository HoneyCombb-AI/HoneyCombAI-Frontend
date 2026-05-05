import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface UpdateNoteRequest {
  id: string;
  content: string;
}

interface UpdateNoteResponse {
  success: boolean;
  note?: {
    id: string;
    notable_type: string;
    notable_id: string;
    content: string;
    created_at: string;
    created_by: string | null;
  };
  error?: string;
}

export async function PATCH(req: NextRequest) {
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
          error: 'Update rate limit exceeded. Please wait before updating more notes.'
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

    const body: UpdateNoteRequest = await req.json();

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'id is required and must be a valid string' },
        { status: 400 }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'content is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Check ownership before updating
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
        { success: false, error: 'You can only edit your own notes' },
        { status: 403 }
      );
    }

    const { data: updatedNote, error: updateError } = await supabase
      .from('notes')
      .update({ content: body.content.trim() })
      .eq('id', body.id)
      .select('id, notable_type, notable_id, content, created_at, created_by')
      .single();

    if (updateError) {
      console.error('Error updating note:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update note' },
        { status: 500 }
      );
    }

    const response: UpdateNoteResponse = {
      success: true,
      note: {
        id: updatedNote.id,
        notable_type: updatedNote.notable_type,
        notable_id: updatedNote.notable_id,
        content: updatedNote.content,
        created_at: updatedNote.created_at,
        created_by: updatedNote.created_by ?? null,
      }
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/notes/update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

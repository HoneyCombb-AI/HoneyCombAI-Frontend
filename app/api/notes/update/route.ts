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
  };
  error?: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
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

    // Parse request body
    const body: UpdateNoteRequest = await req.json();

    // Validate request structure
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

    // Update the note
    const { data: updatedNote, error: updateError } = await supabase
      .from('notes')
      .update({
        content: body.content.trim(),
      })
      .eq('id', body.id)
      .select('*')
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

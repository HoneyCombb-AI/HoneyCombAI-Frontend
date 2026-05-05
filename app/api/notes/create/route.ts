import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface CreateNoteRequest {
  notable_type: 'contact' | 'company';
  notable_id: string;
  content: string;
}

interface InsertedNoteProfile {
  full_name: string | null;
}

interface InsertedNoteRow {
  id: string;
  notable_type: string;
  notable_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  profiles: InsertedNoteProfile[] | InsertedNoteProfile | null;
}

interface CreateNoteResponse {
  success: boolean;
  note?: {
    id: string;
    notable_type: string;
    notable_id: string;
    content: string;
    created_at: string;
    created_by: string | null;
    created_by_name: string | null;
  };
  error?: string;
}

export async function POST(req: NextRequest) {
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
          error: 'Create rate limit exceeded. Please wait before creating more notes.'
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

    const body: CreateNoteRequest = await req.json();

    if (!body.notable_type || !['contact', 'company'].includes(body.notable_type)) {
      return NextResponse.json(
        { success: false, error: 'notable_type must be either "contact" or "company"' },
        { status: 400 }
      );
    }

    if (!body.notable_id || typeof body.notable_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'notable_id is required and must be a valid string' },
        { status: 400 }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'content is required and cannot be empty' },
        { status: 400 }
      );
    }

    const { data, error: insertError } = await supabase
      .from('notes')
      .insert({
        notable_type: body.notable_type,
        notable_id: body.notable_id,
        content: body.content.trim(),
      })
      .select('*, profiles(full_name)')
      .single();

    const insertedNote = data as InsertedNoteRow | null;

    if (insertError || !insertedNote) {
      console.error('Error inserting note:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create note' },
        { status: 500 }
      );
    }

    const response: CreateNoteResponse = {
      success: true,
      note: {
        id: insertedNote.id,
        notable_type: insertedNote.notable_type,
        notable_id: insertedNote.notable_id,
        content: insertedNote.content,
        created_at: insertedNote.created_at,
        created_by: insertedNote.created_by,
        created_by_name: Array.isArray(insertedNote.profiles)
            ? insertedNote.profiles[0]?.full_name ?? null
            : insertedNote.profiles?.full_name ?? null,
      }
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/notes/create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

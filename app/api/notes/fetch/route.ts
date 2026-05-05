import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface NoteProfile {
  id: string;
  full_name: string | null;
}

interface NoteRow {
  id: string;
  notable_type: string;
  notable_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  profiles: NoteProfile[] | NoteProfile | null;
}

interface FetchNotesResponse {
  success: boolean;
  notes?: Array<{
    id: string;
    notable_type: string;
    notable_id: string;
    content: string;
    created_at: string;
    created_by: string | null;
    created_by_name: string | null;
  }>;
  error?: string;
}

export async function GET(req: NextRequest) {
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
          error: 'Fetch rate limit exceeded. Please wait before fetching more notes.'
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

    const searchParams = req.nextUrl.searchParams;
    const notableId = searchParams.get('notable_id');
    const notableType = searchParams.get('notable_type') as 'contact' | 'company' | null;

    if (!notableId) {
      return NextResponse.json(
        { success: false, error: 'notable_id query parameter is required' },
        { status: 400 }
      );
    }

    if (!notableType || !['contact', 'company'].includes(notableType)) {
      return NextResponse.json(
        { success: false, error: 'notable_type query parameter must be either "contact" or "company"' },
        { status: 400 }
      );
    }

    const { data, error: fetchError } = await supabase
      .from('notes')
      .select('id, notable_type, notable_id, content, created_at, created_by, profiles(id, full_name)')
      .eq('notable_type', notableType)
      .eq('notable_id', notableId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching notes:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    const notes = (data ?? []) as NoteRow[];

    const response: FetchNotesResponse = {
      success: true,
      notes: notes.map(note => ({
        id: note.id,
        notable_type: note.notable_type,
        notable_id: note.notable_id,
        content: note.content,
        created_at: note.created_at,
        created_by: note.created_by,
        created_by_name: Array.isArray(note.profiles)
            ? note.profiles[0]?.full_name ?? null
            : note.profiles?.full_name ?? null,
      }))
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/notes/fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

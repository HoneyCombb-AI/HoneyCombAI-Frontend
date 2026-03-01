import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type LinkedInContact = {
  id: string;
  full_name: string;
  current_company: string;
  company_name: string;
  is_connected: boolean;
  conversation_started: boolean;
  reply_received: boolean;
  meeting_booked: boolean;
  automation_enabled: boolean;
  strategy: string;
  // Pending task fields (from get_linkedin_contacts RPC)
  task_id: string | null;
  task_type: string | null;
  draft_message: string | null;
  connection_note: string | null;
  scheduled_at: string | null;
};

export interface LinkedInContactsResponse {
  contacts: LinkedInContact[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('get_linkedin_contacts', {
      p_user_id: user.id,
      p_page: page,
      p_limit: limit,
      p_search: search || null,
    });

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json(
        { error: `Failed to load contacts: ${error.message}` },
        { status: 500 }
      );
    }

    const raw = (data || []) as Record<string, unknown>[];

    // Extract total_count defensively from the first row, with NaN fallback
    const rawTotal = raw.length > 0 ? Number(raw[0].total_count) : 0;
    const total = Number.isFinite(rawTotal) ? rawTotal : 0;

    // Sanitize: only pass through declared LinkedInContact fields
    const contacts: LinkedInContact[] = raw.map((row) => ({
      id: String(row.id ?? ''),
      full_name: String(row.full_name ?? ''),
      current_company: String(row.current_company ?? ''),
      company_name: String(row.company_name ?? ''),
      is_connected: Boolean(row.is_connected),
      conversation_started: Boolean(row.conversation_started),
      reply_received: Boolean(row.reply_received),
      meeting_booked: Boolean(row.meeting_booked),
      automation_enabled: Boolean(row.automation_enabled),
      strategy: String(row.strategy ?? ''),
      task_id: row.task_id ? String(row.task_id) : null,
      task_type: row.task_type ? String(row.task_type) : null,
      draft_message: row.draft_message ? String(row.draft_message) : null,
      connection_note: row.connection_note ? String(row.connection_note) : null,
      scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
    }));

    const hasMore = Number.isFinite(total) && (page * limit) < total;

    const response: LinkedInContactsResponse = {
      contacts,
      total,
      page,
      limit,
      hasMore,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

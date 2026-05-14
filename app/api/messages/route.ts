import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LinkedInContact, LinkedInContactsResponse } from '@/types/messages';

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 });
    }
    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found for user' }, { status: 404 });
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
      task_status: row.task_status ? String(row.task_status) : null,
      draft_message: row.draft_message ? String(row.draft_message) : null,
      connection_note: row.connection_note ? String(row.connection_note) : null,
      scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
      linkedin_account_name: row.linkedin_account_name ? String(row.linkedin_account_name) : null,
      linkedin_account_id: row.linkedin_account_id ? String(row.linkedin_account_id) : null,
      pending_task_count: Number(row.pending_task_count) || 0,
      other_pending_tasks: Array.isArray(row.other_pending_tasks) ? row.other_pending_tasks as { task_type: string; scheduled_at: string | null; task_id: string }[] : [],
    }));

    const hasMore = Number.isFinite(total) && (page * limit) < total;

    const response: LinkedInContactsResponse = {
      contacts,
      total,
      page,
      limit,
      hasMore,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
    });

  } catch (error: unknown) {
    console.error('API /api/messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

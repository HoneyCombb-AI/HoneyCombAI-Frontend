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

    const contacts = (data || []) as LinkedInContact[];
    const total = contacts.length > 0 ? Number((contacts[0] as any).total_count) : 0;
    const hasMore = (page * limit) < total;

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

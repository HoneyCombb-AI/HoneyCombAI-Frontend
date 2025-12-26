import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type StatusFilter = "all" | "pending" | "completed";

export interface OutreachMessage {
  id: string;
  contact_id: string;
  full_name: string;
  profile_picture: string | null;
  content: string | null;
  status: string;
  sender_type: string;
  timestamp: string | null;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MessagesResponse {
  messages: OutreachMessage[];
  total_count: number;
  pagination: PaginationInfo;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const statusFilter = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const offset = (page - 1) * limit;

    const { data: result, error } = await supabase.rpc('get_outreach_messages', {
      page_offset: offset,
      page_limit: limit,
      sort_order: sortOrder,
      status_filter: statusFilter,
      start_date: startDate,
      end_date: endDate,
      search_term: search
    });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return NextResponse.json(result as MessagesResponse);

  } catch (error: unknown) {
    console.error('API /api/messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

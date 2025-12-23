import { NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createDataClient } from '@/lib/supabase/data-server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

export interface CompanyListItem {
  id: string;
  name: string;
}

interface CompanyListResponse {
  companies: CompanyListItem[];
}

export async function GET() {
  try {
    // Auth client (old Supabase): validate session + rate-limit.
    const authSupabase = await createAuthClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply list operations rate limiting
    const rateLimit = await rateLimiters.listPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'List rate limit exceeded. Please wait before making more requests.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }
    
    // Fetch companies for the current user with proper security
    // Data client (new Supabase): fetch companies list.
    // NOTE: We intentionally do not manually filter by user_id here because in a
    // dual-supabase setup, auth IDs may not match the data project's auth.users.
    // If you need strict per-user scoping, it must be enforced in the data DB (RLS)
    // and/or via a backend mapping layer.
    const dataSupabase = createDataClient();

    const { data: companies, error } = await dataSupabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    const response: CompanyListResponse = {
      companies: companies || []
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/companies/list error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
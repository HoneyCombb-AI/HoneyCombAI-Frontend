import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface FetchTagsResponse {
  success: boolean;
  tags?: Array<{
    id: string;
    taggable_type: string;
    taggable_id: string;
    name: string;
    color: string;
    created_at: string;
  }>;
  error?: string;
}

export async function GET(req: NextRequest) {
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
    const rateLimit = await rateLimiters.TagsPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fetch rate limit exceeded. Please wait before fetching more tags.'
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const taggableIds = searchParams.get('taggable_ids')?.split(',') || [];
    const taggableType = searchParams.get('taggable_type') as 'contact' | 'company' | null;

    // Validate parameters
    if (taggableIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'taggable_ids query parameter is required (comma-separated)' },
        { status: 400 }
      );
    }

    if (!taggableType || !['contact', 'company'].includes(taggableType)) {
      return NextResponse.json(
        { success: false, error: 'taggable_type query parameter must be either "contact" or "company"' },
        { status: 400 }
      );
    }

    // Fetch tags for the specified items in a single query
    // Note: Only select needed fields to reduce data transfer
    const { data: tags, error: fetchError } = await supabase
      .from('tags')
      .select('id, taggable_type, taggable_id, name, color, created_at')
      .eq('taggable_type', taggableType)
      .in('taggable_id', taggableIds)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching tags:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    const response: FetchTagsResponse = {
      success: true,
      tags: tags?.map(tag => ({
        id: tag.id,
        taggable_type: tag.taggable_type,
        taggable_id: tag.taggable_id,
        name: tag.name,
        color: tag.color,
        created_at: tag.created_at,
      })) || []
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/tags/fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

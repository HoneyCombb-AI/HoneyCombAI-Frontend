import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface DeleteTagsRequest {
  tag_ids: string[];
}

interface DeleteTagsResponse {
  success: boolean;
  deleted_count?: number;
  error?: string;
}

export async function DELETE(req: NextRequest) {
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
    const rateLimit = await rateLimiters.createPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delete rate limit exceeded. Please wait before deleting more tags.'
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
    const body: DeleteTagsRequest = await req.json();

    // Validate request structure
    if (!body.tag_ids || !Array.isArray(body.tag_ids) || body.tag_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tag_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each tag ID
    for (const tagId of body.tag_ids) {
      if (!tagId || typeof tagId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'All tag IDs must be valid strings' },
          { status: 400 }
        );
      }
    }

    // Perform batch delete in a single database call
    const { error: deleteError, count } = await supabase
      .from('tags')
      .delete({ count: 'exact' })
      .in('id', body.tag_ids);

    if (deleteError) {
      console.error('Error deleting tags:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete tags' },
        { status: 500 }
      );
    }

    const response: DeleteTagsResponse = {
      success: true,
      deleted_count: count || 0
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/tags/delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

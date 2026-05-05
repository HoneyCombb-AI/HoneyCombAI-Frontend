import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface DeleteTagsRequest {
  tag_ids?: string[];
  name?: string;           // global delete: remove this tag name from all contacts
  taggable_type?: string;
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
    const rateLimit = await rateLimiters.TANPerUser(user.id);
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

    let deleteQuery;

    if (body.name && body.taggable_type) {
      // Global delete: remove this tag name from every contact that has it
      if (!['contact', 'company'].includes(body.taggable_type)) {
        return NextResponse.json(
          { success: false, error: 'taggable_type must be contact or company' },
          { status: 400 }
        );
      }
      deleteQuery = supabase
        .from('tags')
        .delete({ count: 'exact' })
        .eq('name', body.name.trim().toLowerCase())
        .eq('taggable_type', body.taggable_type);
    } else if (body.tag_ids && Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
      // Existing behaviour: delete specific tag IDs
      deleteQuery = supabase
        .from('tags')
        .delete({ count: 'exact' })
        .in('id', body.tag_ids);
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide either tag_ids array or name + taggable_type for global delete' },
        { status: 400 }
      );
    }

    // Perform delete
    const { error: deleteError, count } = await deleteQuery;

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

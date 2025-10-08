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

    // Get all tags to verify ownership
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('id, taggable_type, taggable_id')
      .in('id', body.tag_ids);

    if (fetchError) {
      console.error('Error fetching tags:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    if (!existingTags || existingTags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tags found with the provided IDs' },
        { status: 404 }
      );
    }

    // Verify ownership for each tag
    for (const tag of existingTags) {
      if (tag.taggable_type === 'contact') {
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, user_id')
          .eq('id', tag.taggable_id)
          .eq('user_id', user.id)
          .single();

        if (contactError || !contact) {
          return NextResponse.json(
            { success: false, error: `Unauthorized to delete tag for contact ${tag.taggable_id}` },
            { status: 403 }
          );
        }
      } else if (tag.taggable_type === 'company') {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, user_id')
          .eq('id', tag.taggable_id)
          .eq('user_id', user.id)
          .single();

        if (companyError || !company) {
          return NextResponse.json(
            { success: false, error: `Unauthorized to delete tag for company ${tag.taggable_id}` },
            { status: 403 }
          );
        }
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

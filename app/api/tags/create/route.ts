import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface TagInput {
  name: string;
  color: string;
}

interface TagOperation {
  taggable_type: 'contact' | 'company';
  taggable_id: string;
  tags: TagInput[];
}

interface CreateTagsRequest {
  operations: TagOperation[];
}

interface CreateTagsResponse {
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

export async function POST(req: NextRequest) {
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
          error: 'Create rate limit exceeded. Please wait before creating more tags.'
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
    const body: CreateTagsRequest = await req.json();

    // Validate request structure
    if (!body.operations || !Array.isArray(body.operations) || body.operations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Operations array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each operation
    for (const operation of body.operations) {
      if (!operation.taggable_type || !['contact', 'company'].includes(operation.taggable_type)) {
        return NextResponse.json(
          { success: false, error: 'Each operation must have a valid taggable_type (contact or company)' },
          { status: 400 }
        );
      }

      if (!operation.taggable_id || typeof operation.taggable_id !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each operation must have a valid taggable_id' },
          { status: 400 }
        );
      }

      if (!operation.tags || !Array.isArray(operation.tags) || operation.tags.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Each operation must have a tags array with at least one tag' },
          { status: 400 }
        );
      }

      // Validate each tag
      for (const tag of operation.tags) {
        if (!tag.name?.trim()) {
          return NextResponse.json(
            { success: false, error: 'Each tag must have a name' },
            { status: 400 }
          );
        }

        if (!tag.color?.trim()) {
          return NextResponse.json(
            { success: false, error: 'Each tag must have a color' },
            { status: 400 }
          );
        }

        // Validate hex color format
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(tag.color)) {
          return NextResponse.json(
            { success: false, error: 'Color must be a valid hex code (e.g., #FF5733)' },
            { status: 400 }
          );
        }
      }
    }

    // Flatten operations into tag records for batch insert
    const tagsToInsert = body.operations.flatMap(operation =>
      operation.tags.map(tag => ({
        taggable_type: operation.taggable_type,
        taggable_id: operation.taggable_id,
        name: tag.name.trim(),
        color: tag.color.trim().toUpperCase(),
      }))
    );

    // Batch insert all tags in a single database call
    const { data: insertedTags, error: insertError } = await supabase
      .from('tags')
      .insert(tagsToInsert)
      .select('*');

    if (insertError) {
      console.error('Error inserting tags:', insertError);

      // Handle unique constraint violations
      if (insertError.code === '23505') {
        if (insertError.message.includes('unique_taggable_tag_name')) {
          return NextResponse.json(
            { success: false, error: 'One or more tag names already exist for this contact/company' },
            { status: 409 }
          );
        }
        if (insertError.message.includes('unique_taggable_tag_color')) {
          return NextResponse.json(
            { success: false, error: 'One or more tag colors are already in use for this contact/company' },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create tags' },
        { status: 500 }
      );
    }

    const response: CreateTagsResponse = {
      success: true,
      tags: insertedTags?.map(tag => ({
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
    console.error('API /api/tags/create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

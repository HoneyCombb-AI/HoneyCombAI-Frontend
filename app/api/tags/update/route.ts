import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface TagUpdate {
  id: string;
  name?: string;
  color?: string;
}

interface UpdateTagsRequest {
  updates: TagUpdate[];
}

interface GlobalTagUpdateRequest {
  original_name: string;
  taggable_type: string;
  name?: string;
  color?: string;
}

interface UpdateTagsResponse {
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

export async function PATCH(req: NextRequest) {
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
          error: 'Update rate limit exceeded. Please wait before updating more tags.'
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

    const body: UpdateTagsRequest | GlobalTagUpdateRequest = await req.json();

    // Global update path — rename/recolor a tag across all rows by name + type
    if ('original_name' in body) {
      const { original_name, taggable_type, name, color } = body;

      if (!original_name || !taggable_type) {
        return NextResponse.json(
          { success: false, error: 'original_name and taggable_type are required' },
          { status: 400 }
        );
      }

      if (!name && !color) {
        return NextResponse.json(
          { success: false, error: 'At least name or color is required' },
          { status: 400 }
        );
      }

      if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return NextResponse.json(
          { success: false, error: 'Color must be a valid hex code (e.g., #FF5733)' },
          { status: 400 }
        );
      }

      const updateData: { name?: string; color?: string } = {};
      if (name) updateData.name = name.trim().toLowerCase();
      if (color) updateData.color = color.trim().toUpperCase();

      const { error: updateError } = await supabase
        .from('tags')
        .update(updateData)
        .eq('name', original_name)
        .eq('taggable_type', taggable_type);

      if (updateError) {
        if (updateError.code === '23505') {
          return NextResponse.json(
            { success: false, error: 'A tag with that name or color already exists' },
            { status: 409 }
          );
        }
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Per-ID update path (applying tags to specific rows)
    if (!body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of body.updates) {
      if (!update.id || typeof update.id !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each update must have a valid tag id' },
          { status: 400 }
        );
      }

      if (!update.name && !update.color) {
        return NextResponse.json(
          { success: false, error: 'Each update must include at least name or color' },
          { status: 400 }
        );
      }

      // Validate color if provided
      if (update.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(update.color)) {
        return NextResponse.json(
          { success: false, error: 'Color must be a valid hex code (e.g., #FF5733)' },
          { status: 400 }
        );
      }
    }

    // Group updates by identical name/color combinations for batch processing
    const updateGroups = new Map<string, string[]>();

    for (const update of body.updates) {
      const updateData: { name?: string; color?: string } = {};

      if (update.name) {
        updateData.name = update.name.trim();
      }

      if (update.color) {
        updateData.color = update.color.trim().toUpperCase();
      }

      // Create a key based on the update values
      const groupKey = JSON.stringify(updateData);

      if (!updateGroups.has(groupKey)) {
        updateGroups.set(groupKey, []);
      }
      updateGroups.get(groupKey)!.push(update.id);
    }

    // Perform batch updates - one query per unique update combination
    const updatePromises = Array.from(updateGroups.entries()).map(([groupKey, ids]) => {
      const updateData = JSON.parse(groupKey);

      return supabase
        .from('tags')
        .update(updateData)
        .in('id', ids)
        .select('*');
    });

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Error updating tags:', errors);

      // Handle unique constraint violations
      const uniqueError = errors.find(e => e.error?.code === '23505');
      if (uniqueError) {
        const errorMessage = uniqueError.error?.message || '';
        if (errorMessage.includes('unique_taggable_tag_name')) {
          return NextResponse.json(
            { success: false, error: 'Tag name already exists for this contact/company' },
            { status: 409 }
          );
        }
        if (errorMessage.includes('unique_taggable_tag_color')) {
          return NextResponse.json(
            { success: false, error: 'Tag color is already in use for this contact/company' },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { success: false, error: 'Failed to update some tags' },
        { status: 500 }
      );
    }

    // Flatten the results since each result now contains an array of tags
    const updatedTags = results
      .filter(r => r.data)
      .flatMap(r => r.data!);

    const response: UpdateTagsResponse = {
      success: true,
      tags: updatedTags.map(tag => ({
        id: tag.id,
        taggable_type: tag.taggable_type,
        taggable_id: tag.taggable_id,
        name: tag.name,
        color: tag.color,
        created_at: tag.created_at,
      }))
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/tags/update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import type { DrawerContact } from '@/types/contacts';

/**
 * GET /api/contacts/[id] - Fetch detailed contact data for drawer
 * 
 * This endpoint loads comprehensive contact data for detailed view:
 * - Complete contact details with social handles
 * - All signals with descriptions and sources
 * - Contact nudges
 * - Topics of interest
 * - AI analysis results
 * - Social activity metrics
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply detailed view rate limiting
    const rateLimit = await rateLimiters.detailViewPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Detail view rate limit exceeded. Please wait before making more requests.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '300',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }

    // Use optimized single RPC function for maximum performance
    const { data: contacts, error } = await supabase.rpc('get_contact_details', {
      input_contact_id: contactId
    });

    if (error) {
      throw new Error(`Failed to fetch contact details: ${error.message}`);
    }

    const contact = contacts?.[0] || null;

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Data is already properly formatted as JSONB from the database
    const formattedContact: DrawerContact = {
      ...contact,
      signals: contact.signals || [],

      ai_analysis: contact.ai_analysis || [],
      social_activity: contact.social_activity || null
    };

    return NextResponse.json({ contact: formattedContact });

  } catch (error: unknown) {
    console.error('API /api/contacts/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
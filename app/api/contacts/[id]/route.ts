import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import type { DrawerContact } from '@/types/contacts';
import { z } from 'zod';

// ─── Validation schema ───────────────────────────────────────────────────────

const EmailEntrySchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email address'),
  is_primary: z.boolean(),
  label: z.string().max(20, 'Label too long').nullable().optional(),
});

const PhoneEntrySchema = z.object({
  id: z.string().optional(),
  phone: z.string()
    .min(1, 'Phone number is required')
    .max(15, 'Phone number cannot exceed 15 characters')
    .regex(/^\+?\d+$/, 'Phone number can only contain digits and an optional leading +'),
  is_primary: z.boolean(),
  label: z.string().max(20, 'Label too long').nullable().optional(),
});

const ContactUpdateSchema = z.object({
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  linkedin_url: z.string().nullable().optional().refine(
    val => !val || val.startsWith('http'),
    { message: 'LinkedIn URL must start with http:// or https://' }
  ),
  twitter_handle: z.string().nullable().optional().transform(
    val => val ? val.replace(/^@/, '') || null : null
  ),
  instagram_handle: z.string().nullable().optional().transform(
    val => val ? val.replace(/^@/, '') || null : null
  ),
  emails: z.array(EmailEntrySchema).refine(
    emails => emails.filter(e => e.is_primary).length <= 1,
    { message: 'Only one email can be marked as primary' }
  ),
  phones: z.array(PhoneEntrySchema).refine(
    phones => phones.filter(p => p.is_primary).length <= 1,
    { message: 'Only one phone can be marked as primary' }
  ),
}).refine(
  data => {
    const hasLinkedin = data.linkedin_url && data.linkedin_url.trim().length > 0;
    const hasTwitter = data.twitter_handle && data.twitter_handle.trim().length > 0;
    const hasInstagram = data.instagram_handle && data.instagram_handle.trim().length > 0;
    return hasLinkedin || hasTwitter || hasInstagram;
  },
  {
    message: "At least one social media link (LinkedIn, X, or Instagram) is required",
    path: ["linkedin_url"],
  }
);

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
      social_activity: contact.social_activity || null,
      emails: contact.emails || [],
      phones: contact.phones || [],
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

// ─── PATCH /api/contacts/[id] ─────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await rateLimiters.createPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json();
    const result = ContactUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { city, country, linkedin_url, twitter_handle, instagram_handle, emails, phones } = result.data;

    const { error: rpcError } = await supabase.rpc('update_contact', {
      p_contact_id:       contactId,
      p_city:             city             ?? null,
      p_country:          country          ?? null,
      p_linkedin_url:     linkedin_url     ?? null,
      p_twitter_handle:   twitter_handle   ?? null,
      p_instagram_handle: instagram_handle ?? null,
      p_emails:           emails,
      p_phones:           phones,
    });

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('API PATCH /api/contacts/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
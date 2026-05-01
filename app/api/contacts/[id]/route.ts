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
  label: z.string().nullable().optional(),
});

const PhoneEntrySchema = z.object({
  id: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  is_primary: z.boolean(),
  label: z.string().nullable().optional(),
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
});

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

    // Update contact core fields (RLS enforces access)
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ city, country, linkedin_url, twitter_handle, instagram_handle })
      .eq('id', contactId);

    if (updateError) {
      throw new Error(`Failed to update contact: ${updateError.message}`);
    }

    // ── Emails ────────────────────────────────────────────────────────────────

    const { data: existingEmails } = await supabase
      .from('contact_emails')
      .select('id')
      .eq('contact_id', contactId);

    const existingEmailIds = existingEmails?.map(e => e.id as string) || [];
    const keptEmailIds = emails.filter(e => e.id).map(e => e.id as string);
    const deleteEmailIds = existingEmailIds.filter(id => !keptEmailIds.includes(id));

    if (deleteEmailIds.length > 0) {
      const { error } = await supabase.from('contact_emails').delete().in('id', deleteEmailIds);
      if (error) throw new Error(`Failed to delete emails: ${error.message}`);
    }

    for (const email of emails.filter(e => e.id)) {
      const { error } = await supabase
        .from('contact_emails')
        .update({ email: email.email, is_primary: email.is_primary, label: email.label || null })
        .eq('id', email.id!);
      if (error) throw new Error(`Failed to update email: ${error.message}`);
    }

    const newEmails = emails.filter(e => !e.id);
    if (newEmails.length > 0) {
      const { error } = await supabase.from('contact_emails').insert(
        newEmails.map(e => ({
          contact_id: contactId,
          email: e.email,
          is_primary: e.is_primary,
          label: e.label || null,
        }))
      );
      if (error) throw new Error(`Failed to insert emails: ${error.message}`);
    }

    // ── Phones ────────────────────────────────────────────────────────────────

    const { data: existingPhones } = await supabase
      .from('contact_phones')
      .select('id')
      .eq('contact_id', contactId);

    const existingPhoneIds = existingPhones?.map(p => p.id as string) || [];
    const keptPhoneIds = phones.filter(p => p.id).map(p => p.id as string);
    const deletePhoneIds = existingPhoneIds.filter(id => !keptPhoneIds.includes(id));

    if (deletePhoneIds.length > 0) {
      const { error } = await supabase.from('contact_phones').delete().in('id', deletePhoneIds);
      if (error) throw new Error(`Failed to delete phones: ${error.message}`);
    }

    for (const phone of phones.filter(p => p.id)) {
      const { error } = await supabase
        .from('contact_phones')
        .update({ phone: phone.phone, is_primary: phone.is_primary, label: phone.label || null })
        .eq('id', phone.id!);
      if (error) throw new Error(`Failed to update phone: ${error.message}`);
    }

    const newPhones = phones.filter(p => !p.id);
    if (newPhones.length > 0) {
      const { error } = await supabase.from('contact_phones').insert(
        newPhones.map(p => ({
          contact_id: contactId,
          phone: p.phone,
          is_primary: p.is_primary,
          label: p.label || null,
        }))
      );
      if (error) throw new Error(`Failed to insert phones: ${error.message}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('API PATCH /api/contacts/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
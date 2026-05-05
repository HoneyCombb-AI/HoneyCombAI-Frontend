import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import { contactPhonePattern, type ContactEmailInput, type ContactPhoneInput } from '@/lib/contacts/contact-details';
import { z } from 'zod';

const EmailEntrySchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  is_primary: z.boolean(),
  label: z.string().trim().max(20, 'Label too long').nullable().optional(),
});

const PhoneEntrySchema = z.object({
  phone: z.string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(contactPhonePattern, 'Phone number must use digits only, may start with +, and be up to 15 characters total'),
  is_primary: z.boolean(),
  label: z.string().trim().max(20, 'Label too long').nullable().optional(),
});

const CreateContactSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  title: z.string().trim().min(1, 'Title is required'),
  companyId: z.string().optional(),
  linkedinUrl: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  emails: z.array(EmailEntrySchema).optional(),
  phones: z.array(PhoneEntrySchema).optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  twitterProfile: z.string().trim().optional(),
  instagramProfile: z.string().trim().optional(),
}).refine(
  (data) => data.linkedinUrl || data.twitterProfile || data.instagramProfile,
  {
    message: 'At least one social media profile (LinkedIn, Twitter, or Instagram) is required',
    path: ['linkedinUrl'],
  }
).refine(
  (data) => !data.phone || contactPhonePattern.test(data.phone),
  {
    message: 'Phone number must use digits only, may start with +, and be up to 15 characters total',
    path: ['phone'],
  }
).refine(
  (data) => (data.emails || []).filter((email) => email.is_primary).length <= 1,
  {
    message: 'Only one email can be marked as primary',
    path: ['emails'],
  }
).refine(
  (data) => (data.phones || []).filter((phone) => phone.is_primary).length <= 1,
  {
    message: 'Only one phone can be marked as primary',
    path: ['phones'],
  }
);

interface CreateContactRequest {
  fullName: string;
  title: string;
  companyId?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  emails?: ContactEmailInput[];
  phones?: ContactPhoneInput[];
  city?: string;
  country?: string;
  twitterProfile?: string;
  instagramProfile?: string;
}

interface OrganizationStatus {
  has_organization: boolean;
  organization_id: string | null;
  organization_name: string | null;
  is_organization_onboarded: boolean;
}

interface CreateContactResponse {
  success: boolean;
  contact?: {
    id: string;
    full_name: string;
    title: string;
    company_id?: string | null;
    linkedin_url?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    twitter_handle?: string | null;
    instagram_handle?: string | null;
    created_at: string;
  };
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

    // Check user's organization membership and onboarding status
    const { data: orgStatus, error: orgStatusError } = await supabase
      .rpc('check_user_organization_status', { input_user_id: user.id })
      .single() as { data: OrganizationStatus | null; error: unknown };

    if (orgStatusError) {
      console.error('Error checking organization status:', orgStatusError);
      return NextResponse.json(
        { success: false, error: 'Failed to check organization status' },
        { status: 500 }
      );
    }

    // Check if user is part of an organization
    if (!orgStatus || !orgStatus.has_organization) {
      return NextResponse.json(
        { success: false, error: 'You are not part of an organization. You need to create or join an organization first.' },
        { status: 403 }
      );
    }

    // Check if organization has completed onboarding
    if (!orgStatus.is_organization_onboarded) {
      return NextResponse.json(
        { success: false, error: 'Your organization hasn\'t completed onboarding yet. Please contact support to complete onboarding before uploading contacts.' },
        { status: 403 }
      );
    }

    // Apply create operations rate limiting
    const rateLimit = await rateLimiters.createPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Create rate limit exceeded. Please wait before creating more contacts.'
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
    const rawBody: CreateContactRequest = await req.json();
    const parsedBody = CreateContactSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.errors[0].message },
        { status: 400 }
      );
    }

    const body = parsedBody.data;

    // Validate required fields
    if (!body.fullName || !body.title) {
      return NextResponse.json(
        { success: false, error: 'Full name and title are required' },
        { status: 400 }
      );
    }

    // Validate at least one social media profile
    if (!body.linkedinUrl && !body.twitterProfile && !body.instagramProfile) {
      return NextResponse.json(
        { success: false, error: 'At least one social media profile (LinkedIn, Twitter, or Instagram) is required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL if provided
    if (body.linkedinUrl && !body.linkedinUrl.includes('linkedin.com')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid LinkedIn URL' },
        { status: 400 }
      );
    }

    // Validate Twitter URL if provided
    if (body.twitterProfile && !(body.twitterProfile.includes('twitter.com') || body.twitterProfile.includes('x.com'))) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Twitter/X URL' },
        { status: 400 }
      );
    }

    // Validate Instagram URL if provided
    if (body.instagramProfile && !body.instagramProfile.includes('instagram.com')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Instagram URL' },
        { status: 400 }
      );
    }

    // Extract handles from social media URLs
    const extractTwitterHandle = (url: string): string => {
      const match = url.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/);
      return match ? match[1] : url;
    };

    const extractInstagramHandle = (url: string): string => {
      const match = url.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
      return match ? match[1] : url;
    };

    const normalizeEmailRows = (): ContactEmailInput[] => {
      const emailRows = (body.emails || [])
        .map((email) => ({
          email: email.email.trim(),
          is_primary: email.is_primary,
          label: email.label?.trim() || null,
        }))
        .filter((email) => email.email);

      if (emailRows.length > 0) {
        if (!emailRows.some((email) => email.is_primary)) {
          emailRows[0].is_primary = true;
        }
        return emailRows;
      }

      return body.email ? [{ email: body.email.trim(), is_primary: true, label: null }] : [];
    };

    const normalizePhoneRows = (): ContactPhoneInput[] => {
      const phoneRows = (body.phones || [])
        .map((phone) => ({
          phone: phone.phone.trim(),
          is_primary: phone.is_primary,
          label: phone.label?.trim() || null,
        }))
        .filter((phone) => phone.phone);

      if (phoneRows.length > 0) {
        if (!phoneRows.some((phone) => phone.is_primary)) {
          phoneRows[0].is_primary = true;
        }
        return phoneRows;
      }

      return body.phone ? [{ phone: body.phone.trim(), is_primary: true, label: null }] : [];
    };

    const { data: contact, error: createError } = await supabase.rpc('create_contact_with_details', {
      p_user_id: user.id,
      p_full_name: body.fullName,
      p_headline: body.title,
      p_company_id: body.companyId === 'no-company' || !body.companyId ? null : body.companyId,
      p_linkedin_url: body.linkedinUrl || null,
      p_twitter_handle: body.twitterProfile ? extractTwitterHandle(body.twitterProfile) : null,
      p_instagram_handle: body.instagramProfile ? extractInstagramHandle(body.instagramProfile) : null,
      p_city: body.city || null,
      p_country: body.country || null,
      p_emails: normalizeEmailRows(),
      p_phones: normalizePhoneRows(),
    });

    if (createError) {
      console.error('Error creating contact with details:', createError);

      if (createError.code === '23505' && createError.message.includes('linkedin_url')) {
        return NextResponse.json(
          { success: false, error: 'A contact with this LinkedIn URL already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create contact' },
        { status: 500 }
      );
    }

    const createdContact = contact as NonNullable<CreateContactResponse['contact']>;

    const response: CreateContactResponse = {
      success: true,
      contact: {
        id: createdContact.id,
        full_name: createdContact.full_name,
        title: createdContact.title,
        company_id: createdContact.company_id,
        linkedin_url: createdContact.linkedin_url,
        email: createdContact.email,
        phone: createdContact.phone,
        city: createdContact.city,
        country: createdContact.country,
        twitter_handle: createdContact.twitter_handle,
        instagram_handle: createdContact.instagram_handle,
        created_at: createdContact.created_at,
      }
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/contacts/create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

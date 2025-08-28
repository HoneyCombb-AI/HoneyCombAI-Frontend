import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface CreateContactRequest {
  fullName: string;
  title: string;
  companyId?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  twitterProfile?: string;
  instagramProfile?: string;
}

interface CreateContactResponse {
  success: boolean;
  contact?: {
    id: string;
    full_name: string;
    title: string;
    company_id?: string;
    linkedin_url?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    twitter_handle?: string;
    instagram_handle?: string;
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

    // Get user's organization_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to get user profile' },
        { status: 500 }
      );
    }

    // Check if user is part of an organization
    if (!profile.organization_id) {
      return NextResponse.json(
        { success: false, error: 'You are not part of an organization. You need to create or join an organization first.' },
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
    const body: CreateContactRequest = await req.json();
    
    // Validate required fields
    if (!body.fullName?.trim() || !body.title?.trim()) {
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

    // Prepare data for insertion
    const contactData = {
      full_name: body.fullName.trim(),
      title: body.title.trim(),
      company_id: body.companyId === 'no-company' || !body.companyId ? null : body.companyId,
      linkedin_url: body.linkedinUrl?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      country: body.country?.trim() || null,
      twitter_handle: body.twitterProfile?.trim() ? extractTwitterHandle(body.twitterProfile.trim()) : null,
      instagram_handle: body.instagramProfile?.trim() ? extractInstagramHandle(body.instagramProfile.trim()) : null,
      user_id: user.id,
      organization_id: profile.organization_id,
      istracked: false,
      in_crm: false,
    };

    // Insert the contact
    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting contact:', insertError);
      
      // Handle specific errors
      if (insertError.code === '23505') {
        if (insertError.message.includes('linkedin_url')) {
          return NextResponse.json(
            { success: false, error: 'A contact with this LinkedIn URL already exists' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create contact' },
        { status: 500 }
      );
    }

    const response: CreateContactResponse = {
      success: true,
      contact: {
        id: contact.id,
        full_name: contact.full_name,
        title: contact.title,
        company_id: contact.company_id,
        linkedin_url: contact.linkedin_url,
        email: contact.email,
        phone: contact.phone,
        city: contact.city,
        state: contact.state,
        country: contact.country,
        twitter_handle: contact.twitter_handle,
        instagram_handle: contact.instagram_handle,
        created_at: contact.created_at,
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
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface CreateCompanyRequest {
  companyName: string;
  companyWebsite: string;
  linkedinUrl?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CreateCompanyResponse {
  success: boolean;
  company?: {
    id: string;
    name: string;
    company_url: string;
    linkedin_url?: string;
    city?: string;
    state?: string;
    country?: string;
    user_id: string;
    organization_id?: string;
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

    // Apply create operations rate limiting
    const rateLimit = await rateLimiters.createPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Create rate limit exceeded. Please wait before creating more companies.'
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

    // Get user's organization_id and onboarding status from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, is_onboarded')
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

    // Check if user has completed onboarding
    if (!profile.is_onboarded) {
      return NextResponse.json(
        { success: false, error: 'You haven\'t completed onboarding yet. Please check your notifications to complete onboarding before creating companies.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateCompanyRequest = await req.json();
    
    // Validate required fields
    if (!body.companyName?.trim() || !body.companyWebsite?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name and website are required' },
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

    // Prepare data for insertion
    const companyData = {
      name: body.companyName.trim(),
      company_url: body.companyWebsite.trim(),
      linkedin_url: body.linkedinUrl?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      country: body.country?.trim() || null,
      user_id: user.id,
      organization_id: profile.organization_id,
    };

    // Insert the company
    const { data: company, error: insertError } = await supabase
      .from('companies')
      .insert(companyData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting company:', insertError);
      
      // Handle specific errors
      if (insertError.code === '23505') {
        if (insertError.message.includes('company_url')) {
          return NextResponse.json(
            { success: false, error: 'A company with this website URL already exists' },
            { status: 409 }
          );
        }
        if (insertError.message.includes('linkedin_url')) {
          return NextResponse.json(
            { success: false, error: 'A company with this LinkedIn URL already exists' },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create company' },
        { status: 500 }
      );
    }

    const response: CreateCompanyResponse = {
      success: true,
      company: {
        id: company.id,
        name: company.name,
        company_url: company.company_url,
        linkedin_url: company.linkedin_url,
        city: company.city,
        state: company.state,
        country: company.country,
        user_id: company.user_id,
        organization_id: company.organization_id,
        created_at: company.created_at,
      }
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/companies/create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
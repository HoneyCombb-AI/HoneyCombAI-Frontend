import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import { rateLimiters } from '@/app/api/utils/rate-limiter';


const REQUIRED_HEADERS = [
  'full_name',
  'company_name',
  'company_url'
];

const REQUIRED_HEADERS_DESCRIPTION = 'full_name (or first_name & last_name), company_name, company_url';

const SOCIAL_MEDIA_HEADERS = [
  'linkedin_url',
  'twitter_profile',
  'instagram_profile'
];

const OPTIONAL_HEADERS = [
  'title',
  'email',
  'phone',
  'city',
  'state',
  'country',
  'company_linkedin_url',
  'company_industry',
  'company_city',
  'company_state',
  'company_country'
];

const HEADER_ALIASES: Record<string, string> = {
  // Required header aliases
  full_name: 'full_name',
  fullname: 'full_name',
  name: 'full_name',
  contact_name: 'full_name',
  contact_full_name: 'full_name',
  person_name: 'full_name',
  first_and_last_name: 'full_name',

  company_name: 'company_name',
  company: 'company_name',
  organization_name: 'company_name',
  organization: 'company_name',
  business_name: 'company_name',

  company_url: 'company_url',
  company_website: 'company_url',
  company_site: 'company_url',
  website: 'company_url',
  company_web_site: 'company_url',
  company_webpage: 'company_url',
  company_page: 'company_url',

  // Social header aliases
  linkedin_url: 'linkedin_url',
  linkedin: 'linkedin_url',
  linkedin_profile: 'linkedin_url',
  linkedin_link: 'linkedin_url',
  person_linkedin_url: 'linkedin_url',

  twitter_profile: 'twitter_profile',
  twitter: 'twitter_profile',
  twitter_url: 'twitter_profile',
  twitter_handle: 'twitter_profile',
  x_profile: 'twitter_profile',

  instagram_profile: 'instagram_profile',
  instagram: 'instagram_profile',
  instagram_url: 'instagram_profile',
  instagram_handle: 'instagram_profile',

  // Name components used for deriving full name
  first_name: 'first_name',
  firstname: 'first_name',
  first: 'first_name',
  given_name: 'first_name',

  last_name: 'last_name',
  lastname: 'last_name',
  surname: 'last_name',
  family_name: 'last_name',

  // Optional field aliases
  industry: 'company_industry'
};

interface CSVContactData {
  // Required fields
  full_name: string;
  company_name: string;
  company_url: string;

  // At least one social media field required
  linkedin_url?: string;
  twitter_profile?: string;
  instagram_profile?: string;

  // Optional fields
  title?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  company_linkedin_url?: string;
  company_industry?: string;
  company_city?: string;
  company_state?: string;
  company_country?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: string | undefined;
}

interface OrganizationStatus {
  has_organization: boolean;
  organization_id: string | null;
  organization_name: string | null;
  is_organization_onboarded: boolean;
}

interface BulkImportResponse {
  success: boolean;
  total_processed?: number;
  companies_created?: number;
  contacts_created?: number;
  contacts_updated?: number;
  contacts_skipped?: number;
  errors?: Array<{ row: number; error: string }>;
  error?: string;
  details?: string;
  expected_format?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as BulkImportResponse,
        { status: 401 }
      );
    }

    // Parse form data to get CSV file
    const formData = await request.formData();
    const file = formData.get('csv') as File;
    
    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No CSV file provided' 
        } as BulkImportResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid file type. Please upload a CSV file.' 
        } as BulkImportResponse,
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await file.text();
    
    if (!csvText.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'CSV file is empty' 
        } as BulkImportResponse,
        { status: 400 }
      );
    }

    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const normalized = header.trim().toLowerCase().replace(/\s+/g, '_');
        return HEADER_ALIASES[normalized] ?? normalized;
      }
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'CSV parsing failed',
          details: parseResult.errors.map(err => err.message).join(', ')
        } as BulkImportResponse,
        { status: 400 }
      );
    }

    // Validate CSV headers
    const csvHeaders = parseResult.meta.fields || [];
    const headerSet = new Set(csvHeaders);

    const hasFullNameField = headerSet.has('full_name');
    const hasFirstAndLastNameFields = headerSet.has('first_name') && headerSet.has('last_name');

    // Check for required headers
    const missingRequiredHeaders = REQUIRED_HEADERS.filter(header => {
      if (header === 'full_name') {
        return !hasFullNameField && !hasFirstAndLastNameFields;
      }
      return !headerSet.has(header);
    });
    const formattedMissingHeaders = missingRequiredHeaders.map(header =>
      header === 'full_name' ? 'full_name (or first_name & last_name)' : header
    );

    if (missingRequiredHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required CSV columns: ${formattedMissingHeaders.join(', ')}`,
          expected_format: `Required: ${REQUIRED_HEADERS_DESCRIPTION}; At least one social media: ${SOCIAL_MEDIA_HEADERS.join(', ')}; Optional: ${OPTIONAL_HEADERS.join(', ')}`
        } as BulkImportResponse,
        { status: 400 }
      );
    }

    // Check that at least one social media field is present
    const hasSocialMedia = SOCIAL_MEDIA_HEADERS.some(header => csvHeaders.includes(header));

    if (!hasSocialMedia) {
      return NextResponse.json(
        {
          success: false,
          error: `At least one social media field is required: ${SOCIAL_MEDIA_HEADERS.join(', ')}`,
          expected_format: `Required: ${REQUIRED_HEADERS_DESCRIPTION}; At least one social media: ${SOCIAL_MEDIA_HEADERS.join(', ')}; Optional: ${OPTIONAL_HEADERS.join(', ')}`
        } as BulkImportResponse,
        { status: 400 }
      );
    }

    // Validate we have data rows
    if (!parseResult.data || parseResult.data.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'CSV file contains no data rows' 
        } as BulkImportResponse,
        { status: 400 }
      );
    }
    const contacts = (parseResult.data as CSVContactData[]).map((contact) => {
      const fullName = contact.full_name?.trim();
      const firstName = contact.first_name?.trim();
      const lastName = contact.last_name?.trim();

      if ((!fullName || fullName.length === 0) && firstName && lastName) {
        contact.full_name = `${firstName} ${lastName}`.trim();
      } else if ((!fullName || fullName.length === 0) && (firstName || lastName)) {
        contact.full_name = [firstName, lastName].filter(Boolean).join(' ').trim();
      }

      return contact;
    });

    const contactsWithRowNumbers = contacts.map((contact, index) => ({
      ...contact,
      row_number: index + 2
    }));

    // Check user's organization membership and onboarding status
    const { data: orgStatus, error: orgStatusError } = await supabase
      .rpc('check_user_organization_status', { input_user_id: user.id })
      .single() as { data: OrganizationStatus | null; error: unknown };

    if (orgStatusError) {
      console.error('Error checking organization status:', orgStatusError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to check organization status' 
        } as BulkImportResponse,
        { status: 500 }
      );
    }

    // Check if user is part of an organization
    if (!orgStatus || !orgStatus.has_organization) {
      return NextResponse.json(
        { 
          success: false,
          error: 'You are not part of an organization. You need to create or join an organization first.' 
        } as BulkImportResponse,
        { status: 403 }
      );
    }

    // Check if organization has completed onboarding
    if (!orgStatus.is_organization_onboarded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Your organization hasn\'t completed onboarding yet. Please contact support to complete onboarding before bulk importing contacts.'
        } as BulkImportResponse,
        { status: 403 }
      );
    }

    // Apply bulk import rate limiting (after all validations pass)
    const rateLimit = await rateLimiters.bulkImportPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bulk import rate limit exceeded. Please wait before importing again.',
          details: `You can import again at ${new Date(rateLimit.resetTime).toISOString()}`
        } as BulkImportResponse,
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Call RPC function
    const { data: result, error: rpcError } = await supabase.rpc(
      'import_contacts_bulk',
      {
        contacts_data: contactsWithRowNumbers,
        p_user_id: user.id,
        p_organization_id: orgStatus.organization_id
      }
    );

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Import failed during processing',
          details: rpcError.message 
        } as BulkImportResponse,
        { status: 500 }
      );
    }

    // Return the RPC result directly with proper typing
    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Bulk import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        success: false,
        error: 'Server error during import',
        details: errorMessage
      } as BulkImportResponse,
      { status: 500 }
    );
  }
}

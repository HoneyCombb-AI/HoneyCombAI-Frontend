import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import { rateLimiters } from '@/app/api/utils/rate-limiter';


const EXPECTED_HEADERS = [
  'full_name',
  'title', 
  'email',
  'phone',
  'city',
  'state',
  'country',
  'linkedin_url',
  'twitter_profile',
  'instagram_profile',
  'company_name',
  'company_url'
];

interface CSVContactData {
  full_name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  linkedin_url: string;
  twitter_profile: string;
  instagram_profile: string;
  company_name: string;
  company_url: string;
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

    // Apply bulk import rate limiting
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
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
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
    const missingHeaders = EXPECTED_HEADERS.filter(header => !csvHeaders.includes(header));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: `Missing required CSV columns: ${missingHeaders.join(', ')}`,
          expected_format: EXPECTED_HEADERS.join(', ')
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
    const contactsWithRowNumbers = (parseResult.data as CSVContactData[]).map((contact, index) => ({
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

    // Call RPC function
    const { data: result, error: rpcError } = await supabase.rpc(
      'import_contacts_bulk',
      {
        contacts_data: contactsWithRowNumbers,
        user_id: user.id,
        organization_id: orgStatus.organization_id
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
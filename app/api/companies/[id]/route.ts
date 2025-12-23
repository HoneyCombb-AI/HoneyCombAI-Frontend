import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createDataClient } from '@/lib/supabase/data-server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

/**
 * GET /api/companies/[id] - Fetch detailed company data for drawer
 * 
 * This endpoint loads comprehensive company data for detailed view:
 * - Complete company details with all fields
 * - Contact count for the company
 * - All company metadata including description, technology stack
 * - Social links, news data, and company insights
 *
 * Additionally, we fetch the raw `companies` table row as `full_details` so the
 * UI can display *all* columns from the new Supabase schema in a dedicated
 * “Full details” section (without bloating list RPC responses).
 */

export interface DrawerCompany {
  id: string;
  name: string;
  company_url: string | null;
  logo_url: string | null;
  country: string | null;
  industry: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  keywords: string[] | null;
  short_description: string | null;
  technology_names: string[] | null;
  estimated_num_employees: number | null;
  founded_year: number | null;
  Company_Nudges: {
    signals: Array<{
      intent: string;
      description: string;
      source: string;
      tags: string[];
    }>;
  } | null;
  news_data: Array<{
    date: string;
    link: string;
    title: string;
  }> | null;
  created_at: string;
  contact_count: number;
  nudges: Array<{
    intent: string;
    description: string;
    source: string;
    tags: string[];
  }>;
}

/**
 * Full `companies` row from the new Supabase schema.
 * NOTE: Keep this strictly typed (no `any`) and aligned with the DB columns.
 * We intentionally model JSONB as `unknown | null` to avoid unsafe assumptions.
 */
export interface CompanyFullDetails {
  id: string;
  name: string;
  created_at: string | null;
  company_url: string | null;
  user_id: string | null;
  logo_url: string | null;
  country: string | null;
  industry: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  keywords: string[] | null;
  short_description: string | null;
  technology_names: string[] | null;
  estimated_num_employees: number | null;
  founded_year: number | null;
  news_data: unknown | null;
  organization_id: string | null;
  company_analysis_completed: boolean;
  company_analysis_requested: boolean;
  istracked: boolean;
  canonical_company_url: string | null;
}

const COMPANY_FULL_DETAILS_SELECT = [
  'id',
  'name',
  'created_at',
  'company_url',
  'user_id',
  'logo_url',
  'country',
  'industry',
  'linkedin_url',
  'city',
  'state',
  'keywords',
  'short_description',
  'technology_names',
  'estimated_num_employees',
  'founded_year',
  'news_data',
  'organization_id',
  'company_analysis_completed',
  'company_analysis_requested',
  'istracked',
  'canonical_company_url',
].join(',');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Auth client (old Supabase): used only to validate user + rate-limit.
    const authSupabase = await createAuthClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
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

    // Use optimized RPC function for maximum performance
    // Data client (new Supabase): used to fetch company data.
    const dataSupabase = createDataClient();

    const { data: companies, error } = await dataSupabase.rpc('get_company_details', {
      input_company_id: companyId
    });

    if (error) {
      throw new Error(`Failed to fetch company details: ${error.message}`);
    }

    const company = companies?.[0] || null;

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Format company data with nudges parsing
    let nudges: DrawerCompany['nudges'] = [];
    if (company.Company_Nudges?.signals && Array.isArray(company.Company_Nudges.signals)) {
      nudges = company.Company_Nudges.signals;
    }

    const formattedCompany: DrawerCompany = {
      ...company,
      nudges
    };

    /**
     * Fetch raw company row for “Full details”.
     *
     * Important:
     * - We do NOT filter by user_id (RLS handles scoping).
     * - We use an explicit select list for stability and strict typing.
     */
    const { data: fullDetails, error: fullDetailsError } = await dataSupabase
      .from('companies')
      .select(COMPANY_FULL_DETAILS_SELECT)
      .eq('id', companyId)
      .single<CompanyFullDetails>();

    if (fullDetailsError) {
      throw new Error(`Failed to fetch company full_details: ${fullDetailsError.message}`);
    }

    return NextResponse.json({ company: formattedCompany, full_details: fullDetails });

  } catch (error: unknown) {
    console.error('API /api/companies/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
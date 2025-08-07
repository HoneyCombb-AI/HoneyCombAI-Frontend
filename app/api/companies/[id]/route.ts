import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/companies/[id] - Fetch detailed company data for drawer
 * 
 * This endpoint loads comprehensive company data for detailed view:
 * - Complete company details with all fields
 * - Contact count for the company
 * - All company metadata including description, technology stack
 * - Social links, news data, and company insights
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

    const supabase = await createClient();

    // Use optimized RPC function for maximum performance
    const { data: companies, error } = await supabase.rpc('get_company_details', {
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

    return NextResponse.json({ company: formattedCompany });

  } catch (error: unknown) {
    console.error('API /api/companies/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
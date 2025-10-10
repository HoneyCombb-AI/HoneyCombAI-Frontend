import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Signal interface matching contact signals structure
export interface CompanySignal {
  id: string;
  signal_type: string;
  confidence_score: number;
  is_custom: boolean;
}

// Tag interface
export interface CompanyTag {
  id: string;
  name: string;
  color: string;
}

// CLEAN: Only data that appears in the table
export interface DashboardCompany {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  contact_count: number;
  company_analysis_completed : boolean;
  company_analysis_requested : boolean;
  news_requested : boolean;
  signals: CompanySignal[];
  tags: CompanyTag[];
}

// Response interfaces
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CompanyListResponse {
  companies: DashboardCompany[];
  pagination: PaginationInfo;
}

export interface IndustryGroupResponse {
  industries: Record<string, {
    industry: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
    avgEmployees: number;
  }>;
  pagination: PaginationInfo;
}

export interface LocationGroupResponse {
  locations: Record<string, {
    location: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
  }>;
  pagination: PaginationInfo;
}

export interface EmployeeSizeGroupResponse {
  employee_sizes: Record<string, {
    size_range: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
  }>;
  pagination: PaginationInfo;
}

export interface SearchResponse {
  companies: DashboardCompany[];
  pagination: PaginationInfo;
  searchTerm: string;
}

// Helper function to get pagination info
function getPaginationInfo(page: number, limit: number, total: number): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// Helper function to format company data from RPC
function formatCompanyFromRPC(company: {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  contact_count: number;
  signals?: CompanySignal[];
  tags?: CompanyTag[];
  company_analysis_completed?: boolean;
  company_analysis_requested?: boolean;
  news_requested?: boolean;
}): DashboardCompany {
  return {
    id: company.id,
    name: company.name,
    logo_url: company.logo_url,
    industry: company.industry,
    city: company.city,
    state: company.state,
    country: company.country,
    contact_count: company.contact_count,
    company_analysis_completed: company.company_analysis_completed || false,
    company_analysis_requested: company.company_analysis_requested || false,
    news_requested: company.news_requested || false,
    signals: company.signals || [],
    tags: company.tags || []
  };
}


// Move shared query param parsing outside GET
function getQueryParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
    sortBy: searchParams.get('sortBy') || 'name',
    sortOrder: searchParams.get('sortOrder') || 'asc',
    searchTerm: searchParams.get('search') || '',
    groupBy: searchParams.get('groupBy') || 'none',
    locationType: searchParams.get('locationType') || 'country',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { page, limit, sortBy, sortOrder, searchTerm, groupBy, locationType } = getQueryParams(req);
    
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // If search is provided, handle search functionality
    if (searchTerm.trim()) {
      return handleSearch(supabase, searchTerm, page, limit, sortBy, sortOrder);
    }

    // Handle different groupBy options
    switch (groupBy) {
      case 'industry':
        return handleIndustryGrouping(supabase, page, limit, sortBy, sortOrder);
      case 'location':
        return handleLocationGrouping(supabase, page, limit, locationType, sortBy, sortOrder);
      case 'city':
        return handleLocationGrouping(supabase, page, limit, 'city', sortBy, sortOrder);
      case 'state':
        return handleLocationGrouping(supabase, page, limit, 'state', sortBy, sortOrder);
      case 'country':
        return handleLocationGrouping(supabase, page, limit, 'country', sortBy, sortOrder);
      case 'employee_size':
        return handleEmployeeSizeGrouping(supabase, page, limit, sortBy, sortOrder);
      case 'none':
      default:
        return handleCompanyListing(supabase, page, limit, sortBy, sortOrder);
    }

  } catch (error: unknown) {
    console.error('API /api/companies error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function handleCompanyListing(
  supabase: SupabaseClient,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string
): Promise<NextResponse> {
  const offset = (page - 1) * limit;

  // Use RPC function for optimized company listing with counts
  const { data: result, error } = await supabase.rpc('get_companies_with_counts', {
    page_offset: offset,
    page_limit: limit,
    sort_field: sortBy === 'name' ? 'name' : 'created_at',
    sort_order: sortOrder
  });

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  const companies = result?.companies || [];
  const totalCount = result?.total_count || 0;

  // Format companies data using RPC results
  const formattedCompanies: DashboardCompany[] = companies.map((company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    contact_count: number;
    signals?: CompanySignal[];
    tags?: CompanyTag[];
    company_analysis_completed?: boolean;
    company_analysis_requested?: boolean;
    news_requested?: boolean;
  }) => formatCompanyFromRPC(company));

  const pagination = getPaginationInfo(page, limit, totalCount);

  return NextResponse.json({
    companies: formattedCompanies,
    pagination
  } as CompanyListResponse);
}

async function handleSearch(
  supabase: SupabaseClient,
  searchTerm: string,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string
): Promise<NextResponse> {
  const offset = (page - 1) * limit;

  // Use RPC function for optimized search with counts, tags, and signals
  const { data: result, error } = await supabase.rpc('search_companies_with_counts', {
    search_term: searchTerm,
    page_offset: offset,
    page_limit: limit,
    sort_field: sortBy === 'name' ? 'name' : 'created_at',
    sort_order: sortOrder
  });

  if (error) {
    throw new Error(`Failed to search companies: ${error.message}`);
  }

  const companies = result?.companies || [];
  const totalCount = result?.total_count || 0;

  // Format companies data using RPC results
  const formattedCompanies: DashboardCompany[] = companies.map((company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    contact_count: number;
    signals?: CompanySignal[];
    tags?: CompanyTag[];
    company_analysis_completed?: boolean;
    company_analysis_requested?: boolean;
    news_requested?: boolean;
  }) => formatCompanyFromRPC(company));

  const pagination = getPaginationInfo(page, limit, totalCount);

  return NextResponse.json({
    companies: formattedCompanies,
    pagination,
    searchTerm
  } as SearchResponse);
}

async function handleIndustryGrouping(
  supabase: SupabaseClient,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string
): Promise<NextResponse> {
  const offset = (page - 1) * limit;

  // Use RPC function for optimized industry grouping with counts, tags, and signals
  const { data: result, error } = await supabase.rpc('get_companies_grouped_by_industry', {
    page_offset: offset,
    page_limit: limit,
    sort_field: sortBy,
    sort_order: sortOrder
  });

  if (error) {
    throw new Error(`Failed to fetch companies by industry: ${error.message}`);
  }

  const industries = result?.industries || {};
  const totalCount = result?.total_count || 0;

  const pagination = getPaginationInfo(page, limit, totalCount);

  return NextResponse.json({
    industries,
    pagination
  } as IndustryGroupResponse);
}

async function handleLocationGrouping(
  supabase: SupabaseClient,
  page: number,
  limit: number,
  locationType: string,
  sortBy: string,
  sortOrder: string
): Promise<NextResponse> {
  const offset = (page - 1) * limit;

  // Use RPC function for optimized location grouping with counts, tags, and signals
  const { data: result, error } = await supabase.rpc('get_companies_grouped_by_location', {
    location_type: locationType,
    page_offset: offset,
    page_limit: limit,
    sort_field: sortBy,
    sort_order: sortOrder
  });

  if (error) {
    throw new Error(`Failed to fetch companies by location: ${error.message}`);
  }

  const locations = result?.locations || {};
  const totalCount = result?.total_count || 0;

  const pagination = getPaginationInfo(page, limit, totalCount);

  return NextResponse.json({
    locations,
    pagination
  } as LocationGroupResponse);
}

async function handleEmployeeSizeGrouping(
  supabase: SupabaseClient,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string
): Promise<NextResponse> {
  const offset = (page - 1) * limit;

  // Use RPC function for optimized employee size grouping with counts, tags, and signals
  const { data: result, error } = await supabase.rpc('get_companies_grouped_by_employee_size', {
    page_offset: offset,
    page_limit: limit,
    sort_field: sortBy,
    sort_order: sortOrder
  });

  if (error) {
    throw new Error(`Failed to fetch companies by employee size: ${error.message}`);
  }

  const employee_sizes = result?.employee_sizes || {};
  const totalCount = result?.total_count || 0;

  const pagination = getPaginationInfo(page, limit, totalCount);

  return NextResponse.json({
    employee_sizes,
    pagination
  } as EmployeeSizeGroupResponse);
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CompanyNudge {
  intent: string;
  description: string;
  source: string;
  tags: string[];
}

export interface CompanyNudges {
  signals: CompanyNudge[];
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
  nudges: CompanyNudge[];
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

// Helper function to build search conditions
function buildSearchConditions(searchTerm: string) {
  const conditions = [];
  
  // Search in company fields
  conditions.push(`name.ilike.%${searchTerm}%`);
  conditions.push(`industry.ilike.%${searchTerm}%`);
  conditions.push(`city.ilike.%${searchTerm}%`);
  conditions.push(`state.ilike.%${searchTerm}%`);
  conditions.push(`country.ilike.%${searchTerm}%`);
  
  return conditions;
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

// Helper function to get employee size range
function getEmployeeSizeRange(employeeCount: number | null): string {
  if (!employeeCount) return 'Unknown';
  if (employeeCount <= 10) return '1-10';
  if (employeeCount <= 50) return '11-50';
  if (employeeCount <= 200) return '51-200';
  if (employeeCount <= 1000) return '201-1000';
  return '1000+';
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
  Company_Nudges: CompanyNudges | null;
  company_analysis_completed?: boolean;
  company_analysis_requested?: boolean;
  news_requested?: boolean;
}): DashboardCompany {
  // Parse and filter nudges to top 3
  let nudges: CompanyNudge[] = [];
  if (company.Company_Nudges?.signals && Array.isArray(company.Company_Nudges.signals)) {
    nudges = company.Company_Nudges.signals.slice(0, 3);
  }

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
    nudges
  };
}

// Helper function to format company data for non-RPC queries
function formatCompanyData(company: {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  Company_Nudges: CompanyNudges | null;
  company_analysis_completed?: boolean;
  company_analysis_requested?: boolean;
  news_requested?: boolean;
}, contactCounts: Record<string, number>): DashboardCompany {
  // Parse and filter nudges to top 3
  let nudges: CompanyNudge[] = [];
  if (company.Company_Nudges?.signals && Array.isArray(company.Company_Nudges.signals)) {
    nudges = company.Company_Nudges.signals.slice(0, 3);
  }

  return {
    id: company.id,
    name: company.name,
    logo_url: company.logo_url,
    industry: company.industry,
    city: company.city,
    state: company.state,
    country: company.country,
    contact_count: contactCounts[company.id] || 0,
    company_analysis_completed: company.company_analysis_completed || false,
    company_analysis_requested: company.company_analysis_requested || false,
    news_requested: company.news_requested || false,
    nudges
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
    Company_Nudges: CompanyNudges | null;
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
  
  // Build the search query - only essential fields for table display
  let query = supabase
    .from('companies')
    .select(`
      id, name, logo_url, industry, city, state, country, "Company_Nudges"
    `, { count: 'exact' });

  // Add search conditions
  const searchConditions = buildSearchConditions(searchTerm);
  query = query.or(searchConditions.join(','));

  // Add sorting
  const sortField = sortBy === 'name' ? 'name' : sortBy === 'created_at' ? 'created_at' : 'name';
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // Add pagination
  query = query.range(offset, offset + limit - 1);

  const { data: companies, error, count } = await query;
  
  if (error) {
    throw new Error(`Failed to search companies: ${error.message}`);
  }

  // Get contact counts for these companies
  const contactCounts: Record<string, number> = {};
  if (companies && companies.length > 0) {
    const companyIds = companies.map((c) => c.id);
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('company_id')
      .in('company_id', companyIds);

    if (!contactsError && contacts) {
      contacts.forEach((c: { company_id: string }) => {
        if (c.company_id) {
          contactCounts[c.company_id] = (contactCounts[c.company_id] || 0) + 1;
        }
      });
    }
  }

  // Format companies data
  const formattedCompanies: DashboardCompany[] = (companies || []).map((company) => 
    formatCompanyData(company, contactCounts)
  );

  const pagination = getPaginationInfo(page, limit, count || 0);

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
  _sortBy: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _sortOrder: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<NextResponse> {
  // Get all companies - only essential fields for table display
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select(`
      id, name, logo_url, industry, city, state, country, "Company_Nudges", estimated_num_employees
    `);

  if (companiesError) {
    throw new Error(`Failed to fetch companies: ${companiesError.message}`);
  }

  // Get contact counts for all companies
  const contactCounts: Record<string, number> = {};
  if (companies && companies.length > 0) {
    const companyIds = companies.map((c) => c.id);
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('company_id')
      .in('company_id', companyIds);

    if (!contactsError && contacts) {
      contacts.forEach((c: { company_id: string }) => {
        if (c.company_id) {
          contactCounts[c.company_id] = (contactCounts[c.company_id] || 0) + 1;
        }
      });
    }
  }

  // Group by industry
  const industryMap: Record<string, {
    industry: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
    avgEmployees: number;
  }> = {};

  (companies || []).forEach((company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    Company_Nudges: CompanyNudges | null;
    estimated_num_employees: number | null;
  }) => {
    const formattedCompany = formatCompanyData(company, contactCounts);
    const industryKey = company.industry || 'Unknown';

    if (!industryMap[industryKey]) {
      industryMap[industryKey] = {
        industry: industryKey,
        companies: [],
        companyCount: 0,
        totalContacts: 0,
        avgEmployees: 0
      };
    }

    industryMap[industryKey].companies.push(formattedCompany);
    industryMap[industryKey].companyCount++;
    industryMap[industryKey].totalContacts += formattedCompany.contact_count;
  });

  // Calculate average employees for each industry
  Object.values(industryMap).forEach(industry => {
    const employeeCounts = industry.companies
      .map(c => companies?.find(comp => comp.id === c.id)?.estimated_num_employees || 0)
      .filter(count => count > 0);
    
    industry.avgEmployees = employeeCounts.length > 0 
      ? Math.round(employeeCounts.reduce((sum, count) => sum + count, 0) / employeeCounts.length)
      : 0;
  });

  // Apply pagination to industry groups
  const industries = Object.keys(industryMap);
  const totalIndustries = industries.length;
  const offset = (page - 1) * limit;
  const paginatedIndustries = industries.slice(offset, offset + limit);
  
  const paginatedIndustryMap: Record<string, {
    industry: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
    avgEmployees: number;
  }> = {};
  paginatedIndustries.forEach(industry => {
    paginatedIndustryMap[industry] = industryMap[industry];
  });

  const pagination = getPaginationInfo(page, limit, totalIndustries);

  return NextResponse.json({
    industries: paginatedIndustryMap,
    pagination
  } as IndustryGroupResponse);
}

async function handleLocationGrouping(
  supabase: SupabaseClient,
  page: number,
  limit: number,
  locationType: string,
  _sortBy: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _sortOrder: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<NextResponse> {
  // Get all companies - only essential fields for table display
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select(`
      id, name, logo_url, industry, city, state, country, "Company_Nudges"
    `);

  if (companiesError) {
    throw new Error(`Failed to fetch companies: ${companiesError.message}`);
  }

  // Get contact counts for all companies
  const contactCounts: Record<string, number> = {};
  if (companies && companies.length > 0) {
    const companyIds = companies.map((c) => c.id);
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('company_id')
      .in('company_id', companyIds);

    if (!contactsError && contacts) {
      contacts.forEach((c: { company_id: string }) => {
        if (c.company_id) {
          contactCounts[c.company_id] = (contactCounts[c.company_id] || 0) + 1;
        }
      });
    }
  }

  // Group by location
  const locationMap: Record<string, {
    location: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
  }> = {};

  (companies || []).forEach((company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    Company_Nudges: CompanyNudges | null;
  }) => {
    const formattedCompany = formatCompanyData(company, contactCounts);
    let locationKey = 'Unknown';
    
    if (locationType === 'city') {
      locationKey = company.city || 'Unknown';
    } else if (locationType === 'state') {
      locationKey = company.state || 'Unknown';
    } else if (locationType === 'country') {
      locationKey = company.country || 'Unknown';
    }

    if (!locationMap[locationKey]) {
      locationMap[locationKey] = {
        location: locationKey,
        companies: [],
        companyCount: 0,
        totalContacts: 0
      };
    }

    locationMap[locationKey].companies.push(formattedCompany);
    locationMap[locationKey].companyCount++;
    locationMap[locationKey].totalContacts += formattedCompany.contact_count;
  });

  // Apply pagination to location groups
  const locations = Object.keys(locationMap);
  const totalLocations = locations.length;
  const offset = (page - 1) * limit;
  const paginatedLocations = locations.slice(offset, offset + limit);
  
  const paginatedLocationMap: Record<string, {
    location: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
  }> = {};
  paginatedLocations.forEach(location => {
    paginatedLocationMap[location] = locationMap[location];
  });

  const pagination = getPaginationInfo(page, limit, totalLocations);

  return NextResponse.json({
    locations: paginatedLocationMap,
    pagination
  } as LocationGroupResponse);
}

async function handleEmployeeSizeGrouping(
  supabase: SupabaseClient,
  page: number,
  limit: number,
  _sortBy: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _sortOrder: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<NextResponse> {
  // Get all companies - need estimated_num_employees for grouping
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select(`
      id, name, logo_url, industry, city, state, country, "Company_Nudges", estimated_num_employees
    `);

  if (companiesError) {
    throw new Error(`Failed to fetch companies: ${companiesError.message}`);
  }

  // Get contact counts for all companies
  const contactCounts: Record<string, number> = {};
  if (companies && companies.length > 0) {
    const companyIds = companies.map((c) => c.id);
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('company_id')
      .in('company_id', companyIds);

    if (!contactsError && contacts) {
      contacts.forEach((c: { company_id: string }) => {
        if (c.company_id) {
          contactCounts[c.company_id] = (contactCounts[c.company_id] || 0) + 1;
        }
      });
    }
  }

  // Group by employee size
  const employeeSizeMap: Record<string, {
    size_range: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
  }> = {};

  (companies || []).forEach((company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    Company_Nudges: CompanyNudges | null;
    estimated_num_employees: number | null;
  }) => {
    const formattedCompany = formatCompanyData(company, contactCounts);
    const sizeRange = getEmployeeSizeRange(company.estimated_num_employees);

    if (!employeeSizeMap[sizeRange]) {
      employeeSizeMap[sizeRange] = {
        size_range: sizeRange,
        companies: [],
        companyCount: 0,
        totalContacts: 0
      };
    }

    employeeSizeMap[sizeRange].companies.push(formattedCompany);
    employeeSizeMap[sizeRange].companyCount++;
    employeeSizeMap[sizeRange].totalContacts += formattedCompany.contact_count;
  });

  // Apply pagination to employee size groups
  const employeeSizes = Object.keys(employeeSizeMap);
  const totalEmployeeSizes = employeeSizes.length;
  const offset = (page - 1) * limit;
  const paginatedEmployeeSizes = employeeSizes.slice(offset, offset + limit);
  
  const paginatedEmployeeSizeMap: Record<string, {
    size_range: string;
    companies: DashboardCompany[];
    companyCount: number;
    totalContacts: number;
  }> = {};
  paginatedEmployeeSizes.forEach(size => {
    paginatedEmployeeSizeMap[size] = employeeSizeMap[size];
  });

  const pagination = getPaginationInfo(page, limit, totalEmployeeSizes);

  return NextResponse.json({
    employee_sizes: paginatedEmployeeSizeMap,
    pagination
  } as EmployeeSizeGroupResponse);
}
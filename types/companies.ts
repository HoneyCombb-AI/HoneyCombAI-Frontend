// ============================================================
// Companies domain types
// Extracted from: api/companies/route.ts, api/companies/[id]/route.ts,
//                 api/companies/list/route.ts, (dashboard)/companies/page.tsx
// ============================================================

import type { PaginationInfo } from './contacts';
export type { PaginationInfo };

// --- List / Table types (from api/companies/route.ts) ---

export interface CompanyTag {
    id: string;
    name: string;
    color: string;
}

export interface DashboardCompany {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    contact_count: number;
    company_analysis_completed: boolean;
    company_analysis_requested: boolean;
    istracked: boolean;
    tags: CompanyTag[];
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

// --- Company list (from api/companies/list/route.ts) ---

export interface CompanyListItem {
    id: string;
    name: string;
}

// --- Drawer types (from api/companies/[id]/route.ts) ---

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

// --- Page-level types (from (dashboard)/companies/page.tsx) ---

export type CompaniesGroupByType = "none" | "industry" | "location" | "employee_size";
export type CompaniesLocationType = "country" | "state" | "city";
export type CompaniesSortBy = "name" | "created_at";
export type CompaniesSortOrder = "asc" | "desc";

export type CompaniesDashboardResponse =
    | CompanyListResponse
    | IndustryGroupResponse
    | LocationGroupResponse
    | EmployeeSizeGroupResponse
    | SearchResponse;

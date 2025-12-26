import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/app/api/utils/rate-limiter";

interface ExportRequest {
  type: "companies" | "contacts";
  ids: string[];
}

interface CompanyExportData {
  company_id: string;
  name: string;
  website: string | null;
  linkedin_url: string | null;
  industry: string | null;
  location: string;
  employee_count: number | null;
  founded_year: number | null;
  description: string | null;
  keywords: string | null;
  technologies: string | null;
  news_data: string | null;
  company_nudges: string | null;
  logo_url: string | null;
  created_at: Date;
}

interface ContactExportData {
  contact_id: string;
  full_name: string;
  title: string | null;
  company_name: string | null;
  linkedin_url: string | null;
  temperature: string | null;
  tags: string | null;
  signal_types: string | null;
  buying_signals: string | null;
  engagement_hooks: string | null;
  explicit_pain_points: string | null;
  current_priorities: string | null;
  timing_relevance: string | null;
  account_relevance: string | null;
  role_context: string | null;
  recent_developments: string | null;
  strategic_priorities: string | null;
  network_influence: string | null;
  summary: string | null;
  professional_interests: string | null;
  communication_style: string | null;
  decision_indicators: string | null;
  motivation_triggers: string | null;
  high_influence: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Apply CSV export rate limiting
    const rateLimit = await rateLimiters.csvExportPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'CSV export rate limit exceeded. Please wait before exporting more data.'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const body: ExportRequest = await request.json();
    const { type, ids } = body;

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Required: type ('companies' | 'contacts') and ids (array)" },
        { status: 400 }
      );
    }

    let csvData: string;
    let filename: string;

    if (type === "companies") {
      const { data, error } = await supabase.rpc('export_companies_csv', {
        company_ids: ids
      });

      if (error) {
        console.error("Companies export error:", error);
        return NextResponse.json(
          { error: "Failed to export companies data" },
          { status: 500 }
        );
      }

      csvData = convertToCSV(data, getCompaniesHeaders());
      filename = `companies_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === "contacts") {
      const { data, error } = await supabase.rpc('export_contacts_csv', {
        contact_ids: ids
      });

      if (error) {
        console.error("Contacts export error:", error);
        return NextResponse.json(
          { error: "Failed to export contacts data" },
          { status: 500 }
        );
      }

      // data already matches ContactExportData as per RPC definition
      csvData = convertToCSV(data as unknown as ContactExportData[], getContactsHeaders());
      filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else {
      return NextResponse.json(
        { error: "Invalid export type. Must be 'companies' or 'contacts'" },
        { status: 400 }
      );
    }
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function convertToCSV(data: CompanyExportData[] | ContactExportData[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const fieldName = header.toLowerCase().replace(/ /g, '_');
        const value = (row as unknown as Record<string, unknown>)[fieldName];
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

function getCompaniesHeaders(): string[] {
  return [
    'Company ID',
    'Name',
    'Website',
    'LinkedIn URL',
    'Industry',
    'Location',
    'Employee Count',
    'Founded Year',
    'Description',
    'Keywords',
    'Technologies',
    'News Data',
    'Company Nudges',
    'Logo URL',
    'Created At'
  ];
}

function getContactsHeaders(): string[] {
  return [
    'Contact ID',
    'Full Name',
    'Title',
    'Company Name',
    'LinkedIn URL',
    'Temperature',
    'Tags',
    'Signal Types',
    'Buying Signals',
    'Engagement Hooks',
    'Explicit Pain Points',
    'Current Priorities',
    'Timing Relevance',
    'Account Relevance',
    'Role Context',
    'Recent Developments',
    'Strategic Priorities',
    'Network Influence',
    'Summary',
    'Professional Interests',
    'Communication Style',
    'Decision Indicators',
    'Motivation Triggers',
    'High Influence'
  ];
}
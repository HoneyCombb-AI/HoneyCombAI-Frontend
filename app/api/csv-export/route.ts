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
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  about: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  city: string | null;
  country: string | null;
  languages: string | null;
  emails: string | null;
  phones: string | null;
  company_name: string | null;
  company_website: string | null;
  company_linkedin: string | null;
  industry: string | null;
  notes: string | null;
  tags: string | null;
  signal_types: string | null;
  signal_details: string | null;
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
    'Full Name',
    'First Name',
    'Last Name',
    'Title',
    'About',
    'LinkedIn URL',
    'Twitter Handle',
    'Instagram Handle',
    'City',
    'Country',
    'Languages',
    'Emails',
    'Phones',
    'Company Name',
    'Company Website',
    'Company LinkedIn',
    'Industry',
    'Notes',
    'Tags',
    'Signal Types',
    'Signal Details',
  ];
}
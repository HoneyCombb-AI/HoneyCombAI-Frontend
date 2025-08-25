import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ExportRequest {
  type: "companies" | "contacts";
  ids: string[];
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
      // Call companies RPC function
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
      // Call contacts RPC function
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

      csvData = convertToCSV(data, getContactsHeaders());
      filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else {
      return NextResponse.json(
        { error: "Invalid export type. Must be 'companies' or 'contacts'" },
        { status: 400 }
      );
    }

    // Return CSV as downloadable file
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

function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header.toLowerCase().replace(/ /g, '_')];
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        // Escape CSV values that contain commas, quotes, or newlines
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
    'Email',
    'Phone',
    'Location',
    'LinkedIn URL',
    'Twitter Handle',
    'Instagram Handle',
    'Company Name',
    'Company Industry',
    'Company Website',
    'Languages',
    'Experience Summary',
    'Certifications Summary',
    'Projects Summary',
    'Is Tracked',
    'Analysis Completed',
    'In CRM',
    'Nudges',
    'Nudges Date',
    'Signal Types',
    'Signals Summary',
    'Highest Confidence Signal',
    'AI Primary Analysis',
    'AI Detective Reasoning',
    'AI Investigation Decision',
    'AI Strategic Recommendations',
    'AI Confidence Score',
    'AI Confidence Reasoning',
    'Created At',
    'Updated At',
    'Analysis Date'
  ];
}
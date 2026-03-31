import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from "@/app/api/utils/rate-limiter";

interface ExportRow {
    country: string | null;
    email: string | null;
    linkedin_url: string | null;
    job_title: string | null;
    company_name: string | null;
    full_name: string;
    step: number;
    step_label: string;
    open_count: number;
    open_locations: string | null;
    click_count: number;
    click_locations: string | null;
    internally_forwarded: boolean;
    sender_email: string | null;
}

function escapeCSVField(value: string | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function rowsToCSV(rows: ExportRow[]): string {
    const headers = [
        'Country',
        'Email',
        'LinkedIn',
        'Job Title',
        'Company Name',
        'Name',
        'Step',
        'Open Count',
        'Open Locations',
        'Click Count',
        'Click Locations',
        'Internally Forwarded',
        'Sender Email',
    ];

    const csvLines = [headers.join(',')];

    for (const row of rows) {
        csvLines.push([
            escapeCSVField(row.country),
            escapeCSVField(row.email),
            escapeCSVField(row.linkedin_url),
            escapeCSVField(row.job_title),
            escapeCSVField(row.company_name),
            escapeCSVField(row.full_name),
            escapeCSVField(row.step_label),
            String(row.open_count ?? 0),
            escapeCSVField(row.open_locations),
            String(row.click_count ?? 0),
            escapeCSVField(row.click_locations),
            row.internally_forwarded ? 'Yes' : 'No',
            escapeCSVField(row.sender_email),
        ].join(','));
    }

    return csvLines.join('\n');
}

export async function GET(_req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        const { data: rows, error: rpcError } = await supabase.rpc('export_email_analytics_csv');

        if (rpcError) {
            console.error('Failed to export email analytics via RPC:', rpcError);
            return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 });
        }

        const csv = rowsToCSV((rows as ExportRow[]) || []);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="email-analytics-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error: any) {
        console.error('API /api/analytics/export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

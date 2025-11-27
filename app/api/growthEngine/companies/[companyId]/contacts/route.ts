import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface CompanyContactSummary {
  contact_id: string;
  company_id: string | null;
  full_name: string | null;
  profile_picture_url: string | null;
  headline: string | null;
}

export interface CompanyContactsResponse {
  contacts: CompanyContactSummary[];
}

type Params = { companyId?: string };

export async function GET(
  _req: Request,
  context: { params: Params }
): Promise<NextResponse<CompanyContactsResponse | { error: string }>> {
  const companyId = context.params.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<CompanyContactSummary>({
      text: `
        SELECT
          contact_id,
          company_id,
          full_name,
          profile_picture_url,
          headline
        FROM contacts
        WHERE company_id = $1
        ORDER BY created_timestamp DESC NULLS LAST, contact_id DESC
      `,
      values: [companyId],
    });

    return NextResponse.json<CompanyContactsResponse | { error: string }>({
      contacts: rows,
    });
  } catch (error) {
    console.error('Error fetching company contacts:', error);
    return NextResponse.json<CompanyContactsResponse | { error: string }>(
      { error: 'Failed to fetch company contacts' },
      { status: 500 }
    );
  }
}

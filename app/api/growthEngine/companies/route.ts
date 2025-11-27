import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface GrowthEngineCompany {
  company_id: string;
  organization_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  domain: string | null;
  company_name: string | null;
  deal_health: string | null;
  signal_count: number;
  action_count: number;
  contact_count: number;
}

export interface GrowthEngineCompaniesResponse {
  companies: GrowthEngineCompany[];
}

export async function GET(): Promise<
  NextResponse<GrowthEngineCompaniesResponse | { error: string }>
> {
  try {
    const { rows } = await sql<GrowthEngineCompany>({
      text: `
        SELECT
          c.company_id,
          c.organization_id,
          c.created_at,
          c.updated_at,
          c.domain,
          c.company_name,
          c.deal_health,
          COALESCE(cs.signal_count, 0)::INT AS signal_count,
          COALESCE(a.action_count, 0)::INT AS action_count,
          COALESCE(ct.contact_count, 0)::INT AS contact_count
        FROM companies c
        LEFT JOIN (
          SELECT company_id, COUNT(*)::INT AS signal_count
          FROM company_signals
          GROUP BY company_id
        ) cs ON cs.company_id = c.company_id
        LEFT JOIN (
          SELECT company_id, COUNT(*)::INT AS action_count
          FROM account_action_plan
          GROUP BY company_id
        ) a ON a.company_id = c.company_id
        LEFT JOIN (
          SELECT company_id, COUNT(*)::INT AS contact_count
          FROM contacts
          GROUP BY company_id
        ) ct ON ct.company_id = c.company_id
      `
    });

    return NextResponse.json<GrowthEngineCompaniesResponse | { error: string }>({
      companies: rows
    });
  } catch (error) {
    console.error('Error fetching growth engine companies:', error);
    return NextResponse.json<GrowthEngineCompaniesResponse | { error: string }>(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

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
          company_id,
          organization_id,
          created_at,
          updated_at,
          domain,
          company_name,
          deal_health
        FROM companies
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

import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface CompanyHierarchySegment {
  name?: string;
  members?: string[];
  rationale?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CompanyHierarchyResponse {
  hierarchy: CompanyHierarchySegment[] | null;
}

type Params = { companyId?: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> }
): Promise<NextResponse<CompanyHierarchyResponse | { error: string }>> {
  const { companyId } = await context.params;

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<{ segments: CompanyHierarchySegment[] | null }>({
      text: `
        SELECT
          segments
        FROM company_hierarchy
        WHERE company_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      values: [companyId],
    });

    const hierarchy = rows[0]?.segments ?? null;

    return NextResponse.json<CompanyHierarchyResponse | { error: string }>(
      { hierarchy }
    );
  } catch (error) {
    console.error('Error fetching company hierarchy:', error);
    return NextResponse.json<CompanyHierarchyResponse | { error: string }>(
      { error: 'Failed to fetch company hierarchy' },
      { status: 500 }
    );
  }
}

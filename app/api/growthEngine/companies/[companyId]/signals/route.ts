import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface CompanySignalEvidence {
  source_urls?: string[];
  quotes?: string[];
  announcement_date?: string;
  contact_mentioned?: string;
  [key: string]: unknown;
}

export interface CompanySignal {
  signal_id: string;
  company_id: string;
  signal_type: string | null;
  summary: string | null;
  evidence: CompanySignalEvidence | null;
  confidence: number | null;
  recommended_action: string | null;
  urgency: string | null;
  reasoning: string | null;
  linked_priorities: string[] | null;
  source_date: string;
  created_at: string;
}

export interface CompanySignalsResponse {
  signals: CompanySignal[];
}

type Params = { companyId?: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> }
): Promise<NextResponse<CompanySignalsResponse | { error: string }>> {
  const { companyId } = await context.params;

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId is required' },
      { status: 400 }
    );
  }

  try {
    const { rows } = await sql<CompanySignal>({
      text: `
        SELECT
          signal_id,
          company_id,
          signal_type,
          summary,
          evidence,
          confidence::DOUBLE PRECISION AS confidence,
          recommended_action,
          urgency,
          reasoning,
          linked_priorities,
          source_date::TEXT AS source_date,
          created_at::TEXT AS created_at
        FROM company_signals
        WHERE company_id = $1
        ORDER BY created_at DESC
      `,
      values: [companyId],
    });

    return NextResponse.json<CompanySignalsResponse | { error: string }>({
      signals: rows,
    });
  } catch (error) {
    console.error('Error fetching company signals:', error);
    return NextResponse.json<CompanySignalsResponse | { error: string }>(
      { error: 'Failed to fetch company signals' },
      { status: 500 }
    );
  }
}

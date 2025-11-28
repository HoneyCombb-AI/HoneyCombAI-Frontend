import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ContactSignalEvidenceItem {
  result_id?: string;
  timestamp?: string;
  contact_id?: string;
  event_type?: string;
  source_url?: string;
  activity_type?: string | null;
  parent_post_url?: string | null;
  [key: string]: unknown;
}

export interface ContactSignal {
  signal_id: string;
  contact_id: string;
  signal_type: string | null;
  summary: string | null;
  evidence: ContactSignalEvidenceItem[] | null;
  confidence: number | null;
  recommended_action: string | null;
  urgency: string | null;
  reasoning: string | null;
  linked_priorities: string[] | null;
  source_date: string;
  created_at: string;
}

export interface ContactSignalsResponse {
  signals: ContactSignal[];
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
): Promise<NextResponse<ContactSignalsResponse | { error: string }>> {
  const { contactId } = await params;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactSignal>({
      text: `
        SELECT
          signal_id,
          contact_id,
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
        FROM contact_signals
        WHERE contact_id = $1
        ORDER BY created_at DESC
      `,
      values: [contactId],
    });

    return NextResponse.json<ContactSignalsResponse | { error: string }>({
      signals: rows,
    });
  } catch (error) {
    console.error('Error fetching contact signals:', error);
    return NextResponse.json<ContactSignalsResponse | { error: string }>(
      { error: 'Failed to fetch contact signals' },
      { status: 500 }
    );
  }
}

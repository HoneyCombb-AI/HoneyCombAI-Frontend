import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ContactDisc {
  id: string;
  contact_id: string;
  score_d: number | null;
  score_i: number | null;
  score_s: number | null;
  score_c: number | null;
  confidence: string | null;
  interpretation: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  recommended_adaptation: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactDiscResponse {
  disc: ContactDisc[];
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  context: { params: Params }
): Promise<NextResponse<ContactDiscResponse | { error: string }>> {
  const contactId = context.params.contactId;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactDisc>({
      text: `
        SELECT
          id,
          contact_id,
          score_d,
          score_i,
          score_s,
          score_c,
          confidence,
          interpretation,
          strengths,
          weaknesses,
          recommended_adaptation,
          created_at::TEXT AS created_at,
          updated_at::TEXT AS updated_at
        FROM contact_disc
        WHERE contact_id = $1
        ORDER BY created_at DESC
      `,
      values: [contactId],
    });

    return NextResponse.json<ContactDiscResponse | { error: string }>({
      disc: rows,
    });
  } catch (error) {
    console.error('Error fetching contact DISC:', error);
    return NextResponse.json<ContactDiscResponse | { error: string }>(
      { error: 'Failed to fetch contact DISC' },
      { status: 500 }
    );
  }
}

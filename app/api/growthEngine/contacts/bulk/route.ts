import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ContactSummary {
  contact_id: string;
  full_name: string | null;
  headline: string | null;
  profile_picture_url: string | null;
}

export interface ContactBulkResponse {
  contacts: ContactSummary[];
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ContactBulkResponse | { error: string }>> {
  try {
    const body = await req.json();
    const ids: string[] | undefined = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      );
    }

    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    const { rows } = await sql<ContactSummary>({
      text: `
        SELECT
          contact_id,
          full_name,
          headline,
          profile_picture_url
        FROM contacts
        WHERE contact_id = ANY($1)
      `,
      values: [uniqueIds],
    });

    return NextResponse.json<ContactBulkResponse>({ contacts: rows });
  } catch (error) {
    console.error('Error fetching bulk contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

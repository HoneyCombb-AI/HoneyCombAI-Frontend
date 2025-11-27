import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ContactDetail {
  contact_id: string;
  company_id: string | null;
  full_name: string | null;
  headline: string | null;
  profile_url: string | null;
  profile_picture_url: string | null;
  current_company: string | null;
  email: string | null;
  city: string | null;
  location_full: string | null;
}

export interface ContactDetailResponse {
  contact: ContactDetail | null;
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  context: { params: Promise<Params> }
): Promise<NextResponse<ContactDetailResponse | { error: string }>> {
  const { contactId } = await context.params;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactDetail>({
      text: `
        SELECT
          contact_id,
          company_id,
          full_name,
          headline,
          profile_url,
          profile_picture_url,
          current_company,
          email,
          city,
          location_full
        FROM contacts
        WHERE contact_id = $1
        LIMIT 1
      `,
      values: [contactId],
    });

    return NextResponse.json<ContactDetailResponse>({ contact: rows[0] ?? null });
  } catch (error) {
    console.error('Error fetching contact detail:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}

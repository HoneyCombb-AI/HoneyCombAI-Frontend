import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ContactPersona {
  id: string;
  contact_id: string;
  summary: string | null;
  likes: string[] | null;
  dislikes: string[] | null;
  personality_traits: string[] | null;
  cognitive_style: string | null;
  decision_style: string | null;
  risk_posture: string | null;
  social_behavior: string | null;
  conversation_behavior: string | null;
  emotional_drivers: string[] | null;
  friction_triggers: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ContactPersonaResponse {
  persona: ContactPersona[];
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  context: { params: Params }
): Promise<NextResponse<ContactPersonaResponse | { error: string }>> {
  const contactId = context.params.contactId;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactPersona>({
      text: `
        SELECT
          id,
          contact_id,
          summary,
          likes,
          dislikes,
          personality_traits,
          cognitive_style,
          decision_style,
          risk_posture,
          social_behavior,
          conversation_behavior,
          emotional_drivers,
          friction_triggers,
          strengths,
          weaknesses,
          created_at::TEXT AS created_at,
          updated_at::TEXT AS updated_at
        FROM contact_persona
        WHERE contact_id = $1
        ORDER BY created_at DESC
      `,
      values: [contactId],
    });

    return NextResponse.json<ContactPersonaResponse | { error: string }>({
      persona: rows,
    });
  } catch (error) {
    console.error('Error fetching contact persona:', error);
    return NextResponse.json<ContactPersonaResponse | { error: string }>(
      { error: 'Failed to fetch contact persona' },
      { status: 500 }
    );
  }
}

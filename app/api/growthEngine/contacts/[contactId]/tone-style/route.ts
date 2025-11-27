import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface ContactToneStyle {
  id: string;
  contact_id: string;
  tone: string | null;
  structure: string | null;
  emotional_tone: string | null;
  tolerance_for_detail: string | null;
  warmth_vs_formality: string | null;
  agreement_disagreement_style: string | null;
  pace: string | null;
  signals: string[] | null;
  trusted_information_types: string[] | null;
  ideal_tone: string | null;
  ideal_style: string | null;
  language_patterns: string[] | null;
  structure_to_use: string | null;
  emotional_approach: string | null;
  short_openers: string[] | null;
  long_openers: string[] | null;
  revival_messages: string[] | null;
  do_list: string[] | null;
  dont_list: string[] | null;
  sensitivities: string[] | null;
  behavioral_triggers: string[] | null;
  topics_to_avoid: string[] | null;
  counterproductive_tones: string[] | null;
  frustrating_patterns: string[] | null;
  affinity_nudges: string[] | null;
  context_nudges: string[] | null;
  emotional_nudges: string[] | null;
  reciprocity_nudges: string[] | null;
  curiosity_hooks: string[] | null;
  authority_cues: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ContactToneStyleResponse {
  tone_style: ContactToneStyle[];
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  context: { params: Params }
): Promise<NextResponse<ContactToneStyleResponse | { error: string }>> {
  const contactId = context.params.contactId;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactToneStyle>({
      text: `
        SELECT
          id,
          contact_id,
          tone,
          structure,
          emotional_tone,
          tolerance_for_detail,
          warmth_vs_formality,
          agreement_disagreement_style,
          pace,
          signals,
          trusted_information_types,
          ideal_tone,
          ideal_style,
          language_patterns,
          structure_to_use,
          emotional_approach,
          short_openers,
          long_openers,
          revival_messages,
          do_list,
          dont_list,
          sensitivities,
          behavioral_triggers,
          topics_to_avoid,
          counterproductive_tones,
          frustrating_patterns,
          affinity_nudges,
          context_nudges,
          emotional_nudges,
          reciprocity_nudges,
          curiosity_hooks,
          authority_cues,
          created_at::TEXT AS created_at,
          updated_at::TEXT AS updated_at
        FROM contact_tone_style
        WHERE contact_id = $1
        ORDER BY created_at DESC
      `,
      values: [contactId],
    });

    return NextResponse.json<ContactToneStyleResponse | { error: string }>({
      tone_style: rows,
    });
  } catch (error) {
    console.error('Error fetching contact tone/style:', error);
    return NextResponse.json<ContactToneStyleResponse | { error: string }>(
      { error: 'Failed to fetch contact tone/style' },
      { status: 500 }
    );
  }
}

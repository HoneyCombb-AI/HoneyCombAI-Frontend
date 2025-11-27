import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface CompanyAction {
  action_id: string;
  company_id: string;
  deal_stage: string | null;
  analysis_date: string | null;
  target_contact_name: string;
  target_contact_id: string | null;
  target_contact_title: string | null;
  target_contact_role: string | null;
  priority: string;
  timeline: string | null;
  action_type: string;
  natural_language_action: string | null;
  rationale: string | null;
  playbook_source: string | null;
  expected_outcome: string | null;
  trigger_signals_json: string[] | null;
  personalization_used_json: string[] | null;
  draft_connection_note: string | null;
  draft_message_draft: string | null;
  draft_tone_notes: string | null;
  draft_follow_up_if_accepted: string | null;
  draft_follow_up_if_no_response: string | null;
  draft_prerequisite: string | null;
  draft_attachments: string | null;
  draft_subject_line: string | null;
}

export interface CompanyActionsResponse {
  actions: CompanyAction[];
}

type Params = { companyId?: string };

export async function GET(
  _req: Request,
  context: { params: Params }
): Promise<NextResponse<CompanyActionsResponse | { error: string }>> {
  const companyId = context.params.companyId;

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId is required' },
      { status: 400 }
    );
  }

  try {
    const { rows } = await sql<CompanyAction>({
      text: `
        SELECT
          action_id,
          company_id,
          deal_stage,
          analysis_date::TEXT AS analysis_date,
          target_contact_name,
          target_contact_id,
          target_contact_title,
          target_contact_role,
          priority,
          timeline,
          action_type,
          natural_language_action,
          rationale,
          playbook_source,
          expected_outcome,
          trigger_signals_json,
          personalization_used_json,
          draft_connection_note,
          draft_message_draft,
          draft_tone_notes,
          draft_follow_up_if_accepted,
          draft_follow_up_if_no_response,
          draft_prerequisite,
          draft_attachments,
          draft_subject_line
        FROM account_action_plan
        WHERE company_id = $1
        ORDER BY analysis_date DESC NULLS LAST, action_id DESC
      `,
      values: [companyId],
    });

    return NextResponse.json<CompanyActionsResponse | { error: string }>({
      actions: rows,
    });
  } catch (error) {
    console.error('Error fetching company actions:', error);
    return NextResponse.json<CompanyActionsResponse | { error: string }>(
      { error: 'Failed to fetch company actions' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface NetworkNode {
  id: string;
  name: string;
  headline?: string | null;
  engagement_score?: number | null;
  type?: string | null;
  [key: string]: unknown;
}

export interface NetworkEdge {
  from: string;
  to: string;
  weight?: number | null;
  [key: string]: unknown;
}

export interface NetworkInfluence {
  id: string;
  score: number;
  name?: string | null;
  [key: string]: unknown;
}

export interface NetworkEngager {
  id: string;
  score: number;
  name?: string | null;
  [key: string]: unknown;
}

export interface ContactNetwork {
  relationship_id: string;
  contact_id: string;
  nodes: NetworkNode[] | null;
  edges: NetworkEdge[] | null;
  top_influence: NetworkInfluence[] | null;
  top_engagers_inbound: NetworkEngager[] | null;
  top_engagers_outbound: NetworkEngager[] | null;
  created_at: string | null;
}

export interface ContactNetworkResponse {
  network: ContactNetwork | null;
}

type Params = { contactId?: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
): Promise<NextResponse<ContactNetworkResponse | { error: string }>> {
  const { contactId } = await params;

  if (!contactId) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
  }

  try {
    const { rows } = await sql<ContactNetwork>({
      text: `
        SELECT
          relationship_id,
          contact_id,
          nodes,
          edges,
          top_influence,
          top_engagers_inbound,
          top_engagers_outbound,
          created_at::TEXT AS created_at
        FROM contact_graph_relationships
        WHERE contact_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      values: [contactId],
    });

    const network = rows[0] ?? null;

    return NextResponse.json<ContactNetworkResponse | { error: string }>({
      network,
    });
  } catch (error) {
    console.error('Error fetching contact network:', error);
    return NextResponse.json<ContactNetworkResponse | { error: string }>(
      { error: 'Failed to fetch contact network' },
      { status: 500 }
    );
  }
}

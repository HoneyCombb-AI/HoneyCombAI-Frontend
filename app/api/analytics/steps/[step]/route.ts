import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StepContact } from '@/types/analytics';

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ step: string }> }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { step } = await params;
        const stepNum = Number(step);

        if (!Number.isInteger(stepNum) || stepNum <= 0) {
            return NextResponse.json({ error: 'Invalid step parameter' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const rawLimit = Number.parseInt(searchParams.get('limit') ?? '30', 10);
        const rawPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
        const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
        const offset = (page - 1) * limit;

        const { data: contacts, error: rpcError } = await supabase.rpc('get_step_contacts', {
            p_step: stepNum,
            p_page_offset: offset,
            p_page_limit: limit
        });

        if (rpcError) {
            console.error('Failed to load step contacts via RPC:', rpcError);
            return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 });
        }

        const rawContacts = contacts || [];
        const totalCount = rawContacts.length > 0 ? Number(rawContacts[0].total_count) : 0;

        const formattedContacts: StepContact[] = rawContacts.map((contact: any) => ({
            contact_id: contact.contact_id,
            contact_name: contact.contact_name,
            contact_email: contact.contact_email,
            contact_linkedin: contact.contact_linkedin,
            subject: contact.subject,
            sent_at: contact.sent_at,
            position: contact.position,
            unique_opens: Number(contact.unique_opens),
            unique_clicks: Number(contact.unique_clicks),
            raw_events: contact.raw_events || []
        }));

        const pagination: PaginationInfo = {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNext: offset + limit < totalCount,
            hasPrev: page > 1
        };

        return NextResponse.json({
            data: formattedContacts,
            pagination
        });

    } catch (error: any) {
        console.error('API /api/analytics/steps/[step] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

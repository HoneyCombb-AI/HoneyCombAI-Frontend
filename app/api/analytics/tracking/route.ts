import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import type { PaginatedTrackingGroup } from '@/types/analytics';

// locationCache removed

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const rawLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
        const rawPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
        const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
        const searchTerm = searchParams.get('search') || '';
        const locationFilter = searchParams.get('location') || null;
        const rawStep = searchParams.get('step');
        let stepFilter: number | null = null;
        if (rawStep !== null) {
            const parsedStep = Number.parseInt(rawStep, 10);
            if (Number.isNaN(parsedStep)) {
                return NextResponse.json({ error: 'Invalid step: must be an integer' }, { status: 400 });
            }
            stepFilter = parsedStep;
        }

        const offset = (page - 1) * limit;

        const { data: groupedEvents, error: rpcError } = await supabase.rpc('get_paginated_email_analytics', {
            search_term: searchTerm,
            page_offset: offset,
            page_limit: limit,
            p_location_filter: locationFilter,
            p_step_filter: stepFilter
        });

        if (rpcError) {
            console.error('Failed to load paginated tracking events via RPC:', rpcError);
            return NextResponse.json({ error: 'Failed to load tracking events' }, { status: 500 });
        }

        const rawGroups = groupedEvents || [];

        const rpcTotal = rawGroups.length > 0 ? Number(rawGroups[0].total_count) : 0;

        // Build formatted groups — filter discards groups with no raw events.
        const formattedGroups: PaginatedTrackingGroup[] = rawGroups
            .map((group: any) => {
                const allEvents: any[] = group.raw_events || [];

                return {
                    contact_id: group.contact_id,
                    contact_name: group.contact_name,
                    contact_email: group.contact_email,
                    contact_linkedin: group.contact_linkedin,
                    subject: group.subject,
                    sent_at: group.sent_at,
                    position: group.position,
                    total_activity: group.total_activity,
                    latest_activity: group.latest_activity,
                    raw_events: allEvents,
                };
            })
            // Remove groups with no raw events left
            .filter((group: PaginatedTrackingGroup) => group.raw_events && group.raw_events.length > 0);

        const totalCount = formattedGroups.length > 0 ? rpcTotal : 0;

        return NextResponse.json({
            data: formattedGroups,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: offset + formattedGroups.length < totalCount,
                hasPrev: page > 1
            }
        });

    } catch (error: any) {
        console.error('API /api/analytics/tracking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

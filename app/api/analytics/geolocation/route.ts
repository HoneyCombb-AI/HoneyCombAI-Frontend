import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const searchTerm = searchParams.get('search') || '';
        const locationFilter = searchParams.get('location') || null;
        const countryFilter = searchParams.get('country') || null;
        const cityFilter = searchParams.get('city') || null;
        const regionFilter = searchParams.get('region') || null;

        // step: must be a finite non-negative integer, or omitted
        const rawStep = searchParams.get('step');
        const parsedStep = rawStep !== null ? Number.parseInt(rawStep, 10) : null;
        if (parsedStep !== null && (!Number.isFinite(parsedStep) || parsedStep < 0)) {
            return NextResponse.json({ error: 'Invalid step: must be a non-negative integer' }, { status: 400 });
        }
        const stepFilter = parsedStep;

        // page: integer >= 1, default 1
        const rawPage = searchParams.get('page');
        const parsedPage = rawPage !== null ? Number.parseInt(rawPage, 10) : 1;
        if (!Number.isFinite(parsedPage) || parsedPage < 1) {
            return NextResponse.json({ error: 'Invalid page: must be an integer >= 1' }, { status: 400 });
        }
        const page = parsedPage;

        // limit: integer clamped to 1–100, default 30
        const rawLimit = searchParams.get('limit');
        const parsedLimit = rawLimit !== null ? Number.parseInt(rawLimit, 10) : 30;
        if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
            return NextResponse.json({ error: 'Invalid limit: must be an integer >= 1' }, { status: 400 });
        }
        const limit = Math.min(parsedLimit, 100);

        // group_by: whitelist only
        const VALID_GROUP_BY = ['country', 'region', 'city'] as const;
        type GroupBy = typeof VALID_GROUP_BY[number];
        const rawGroupBy = searchParams.get('group_by') ?? 'country';
        if (!(VALID_GROUP_BY as readonly string[]).includes(rawGroupBy)) {
            return NextResponse.json({ error: `Invalid group_by: must be one of ${VALID_GROUP_BY.join(', ')}` }, { status: 400 });
        }
        const groupBy = rawGroupBy as GroupBy;

        const { data: response, error: rpcError } = await supabase.rpc('get_geolocation_metrics', {
            p_search_term: searchTerm,
            p_location_filter: locationFilter,
            p_step_filter: stepFilter,
            p_country_filter: countryFilter,
            p_city_filter: cityFilter,
            p_region_filter: regionFilter,
            p_group_by: groupBy,
            p_page: page,
            p_limit: limit
        });

        if (rpcError) {
            console.error('Failed to load geolocation metrics via RPC:', rpcError);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('API /api/analytics/geolocation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

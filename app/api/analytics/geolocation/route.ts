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
        const rawStep = searchParams.get('step');
        const stepFilter = rawStep ? Number.parseInt(rawStep, 10) : null;
        const countryFilter = searchParams.get('country') || null;
        const cityFilter = searchParams.get('city') || null;
        const regionFilter = searchParams.get('region') || null;
        const rawLimit = searchParams.get('limit');
        const limit = rawLimit ? Number.parseInt(rawLimit, 10) : 30;
        const rawPage = searchParams.get('page');
        const page = rawPage ? Number.parseInt(rawPage, 10) : 1;
        const groupBy = searchParams.get('group_by') || 'country';

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
            return NextResponse.json({ error: `Failed to load metrics: ${rpcError.message}` }, { status: 500 });
        }

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('API /api/analytics/geolocation error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

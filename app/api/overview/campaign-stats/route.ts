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
        const campaignId = searchParams.get('campaign_id');
        const startDate = searchParams.get('start_date') || null;
        const endDate = searchParams.get('end_date') || null;

        if (!campaignId) {
            return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('get_campaign_drawer_stats', {
            p_campaign_id: campaignId,
            p_start_date: startDate,
            p_end_date: endDate,
        });

        if (error) {
            console.error('Failed to fetch campaign stats:', error);
            return NextResponse.json({ error: 'Failed to fetch campaign stats' }, { status: 500 });
        }

        if (data?.error === 'no_organization') {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }
        if (data?.error === 'not_found') {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('API /api/overview/campaign-stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

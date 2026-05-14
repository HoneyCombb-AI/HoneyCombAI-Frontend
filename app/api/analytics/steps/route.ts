import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StepMetric } from '@/types/analytics';

export async function GET(_req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
        }
        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found for user' }, { status: 404 });
        }

        const { data: metrics, error: rpcError } = await supabase.rpc('get_step_metrics');

        if (rpcError) {
            console.error('Failed to load step metrics via RPC:', rpcError);
            return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
        }

        return NextResponse.json({
            data: metrics as StepMetric[]
        }, {
            headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=300' }
        });

    } catch (error: any) {
        console.error('API /api/analytics/steps error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

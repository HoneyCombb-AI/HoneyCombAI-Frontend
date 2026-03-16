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

        const { data: metrics, error: rpcError } = await supabase.rpc('get_step_metrics');

        if (rpcError) {
            console.error('Failed to load step metrics via RPC:', rpcError);
            return NextResponse.json({ error: `Failed to load metrics: ${rpcError.message}` }, { status: 500 });
        }

        return NextResponse.json({
            data: metrics as StepMetric[]
        });

    } catch (error: any) {
        console.error('API /api/analytics/steps error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

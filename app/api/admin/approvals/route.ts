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
        const status = searchParams.get('status') || 'pending';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Single RPC call — handles admin check, pagination, all joins
        const { data, error } = await supabase.rpc('get_approval_queue', {
            p_user_id: user.id,
            p_status: status,
            p_page: page,
            p_limit: limit,
        });

        if (error) {
            console.error('Error in get_approval_queue RPC:', error);
            return NextResponse.json(
                { error: 'Failed to fetch approvals' },
                { status: 500 }
            );
        }

        // RPC returns forbidden if user isn't admin
        if (data?.error === 'forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Error in approvals route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

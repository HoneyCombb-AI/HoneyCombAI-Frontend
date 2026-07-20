import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('id, name, status, created_at')
            .eq('organization_id', profile.organization_id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch campaigns list:', error);
            return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
        }

        return NextResponse.json({ data: campaigns || [] });
    } catch (error) {
        console.error('API /api/campaigns/list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

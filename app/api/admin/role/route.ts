import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's org membership with role
        const { data: membership, error: memberError } = await supabase
            .from('organization_members')
            .select('role, organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (memberError || !membership) {
            return NextResponse.json({
                role: null,
                approval_required: false,
                organization_id: null,
            });
        }

        // Get org approval setting
        const { data: org } = await supabase
            .from('organizations')
            .select('approval_required')
            .eq('id', membership.organization_id)
            .single();

        return NextResponse.json({
            role: membership.role || 'user',
            approval_required: org?.approval_required ?? false,
            organization_id: membership.organization_id,
        });

    } catch (error: unknown) {
        console.error('Error fetching admin role:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

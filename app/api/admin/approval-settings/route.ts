import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { approval_required } = body;

        if (typeof approval_required !== 'boolean') {
            return NextResponse.json(
                { error: 'approval_required must be a boolean' },
                { status: 400 }
            );
        }

        // Verify user is admin
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role, organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!membership || membership.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update org setting
        const { error: updateError } = await supabase
            .from('organizations')
            .update({ approval_required })
            .eq('id', membership.organization_id);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to update setting' },
                { status: 500 }
            );
        }

        return NextResponse.json({ approval_required });

    } catch (error: unknown) {
        console.error('Error updating approval settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

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
        const q = searchParams.get('q')?.trim() || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

        if (q.length < 2) {
            return NextResponse.json({ contacts: [] });
        }

        // Get user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!membership) {
            return NextResponse.json({ contacts: [] });
        }

        const { data, error } = await supabase
            .from('contacts')
            .select('id, full_name, email, company:companies(name)')
            .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
            .limit(limit);

        if (error) {
            console.error('Contact search error:', error);
            return NextResponse.json({ contacts: [] });
        }

        const contacts = (data || []).map((c) => ({
            id: c.id,
            full_name: c.full_name,
            email: c.email,
            company_name: (c.company as { name: string }[] | null)?.[0]?.name || null,
        }));

        return NextResponse.json({ contacts });

    } catch (error) {
        console.error('Contact search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

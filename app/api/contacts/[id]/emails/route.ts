import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('contact_emails')
            .select('id, email, is_primary, label')
            .eq('contact_id', id)
            .order('is_primary', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
        }

        return NextResponse.json({ emails: data ?? [] });

    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

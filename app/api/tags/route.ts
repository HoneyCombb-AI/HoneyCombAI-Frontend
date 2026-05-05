import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const taggableType = req.nextUrl.searchParams.get('taggable_type') ?? 'contact';

        if (taggableType !== 'contact' && taggableType !== 'company') {
            return NextResponse.json({ error: 'Invalid taggable_type' }, { status: 400 });
        }

        const { data: tags, error } = await supabase
            .from('tags')
            .select('name, color')
            .eq('taggable_type', taggableType);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // De-duplicate tags by name
        const uniqueTags = Array.from(new Map(tags.map(t => [t.name, t])).values());

        return NextResponse.json(uniqueTags);

    } catch (error: unknown) {
        return NextResponse.json(
            { error: 'Failed to load tags' },
            { status: 500 }
        );
    }
}

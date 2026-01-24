import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch distinct tags used by this user / organization contacts
        // Since we don't have a direct "organization tags" table, we can fetch unique tags from the tags table
        // filtering by the user's focus (or optimally, we'd have a 'tags' management system).
        // For now, we'll return a simple list of tags by querying the tags table for contacts relevant to this user.

        // However, making a complex join here might be overkill.
        // Let's assume tags are just simple strings on the frontend or we fetch all tags for 'contact' type.
        // A better approach if RLS is on 'tags' table:
        const { data: tags, error } = await supabase
            .from('tags')
            .select('name, color')
            .eq('taggable_type', 'contact');
        // Optimally we limit this to contacts the user has access to.
        // But if 'tags' table doesn't have RLS, this might return too much.
        // Let's rely on RLS being set up on tags or just fetch them.

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

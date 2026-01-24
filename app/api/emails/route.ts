import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type EmailStatusFilter = "all" | "valid" | "invalid" | "risky" | "unknown";
export type EmailTemperatureFilter = "all" | "hot" | "warm" | "cold";

export type ContactEmail = {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    company_name: string;
    tags: { name: string; color: string }[];
};

export interface EmailsResponse {
    emails: ContactEmail[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const tagsParam = searchParams.get('tags');
        const tags = tagsParam ? tagsParam.split(',') : null;

        // Get authenticated user to fetch their organization
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization from profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.organization_id) {
            return NextResponse.json(
                { error: 'Organization not found for user' },
                { status: 404 }
            );
        }

        const organizationId = profile.organization_id;

        // Call RPC function
        const { data, error } = await supabase.rpc('get_email_view_contacts', {
            p_org_id: organizationId,
            p_page: page,
            p_limit: limit,
            p_search: search,
            p_tag_names: tags
        });

        if (error) {
            console.error('RPC Error:', error);
            return NextResponse.json(
                { error: `Failed to load contacts: ${error.message}` },
                { status: 500 }
            );
        }

        const emails = data as ContactEmail[];
        const total = emails.length > 0 ? Number((emails[0] as any).total_count) : 0;
        const hasMore = (page * limit) < total;

        const response: EmailsResponse = {
            emails,
            total,
            page,
            limit,
            hasMore
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error('API /api/emails error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

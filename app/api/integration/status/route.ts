import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { IntegrationStatuses } from "@/lib/types/integration";

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profileError) {
        return NextResponse.json({ error: 'Profile retrieval failed' }, { status: 500 });
    }
    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'Organization not found for user' }, { status: 404 });
    }

    const { data, error } = await supabase.rpc("get_integration_statuses");

    if (error) {
        console.error("Error fetching integration statuses:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as IntegrationStatuses, {
        headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
}

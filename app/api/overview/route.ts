import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";



export async function GET() {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { data, error } = await supabase.rpc("get_dashboard_overview");

    if (error) {
        console.error("Error fetching dashboard overview:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, {
        headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
}

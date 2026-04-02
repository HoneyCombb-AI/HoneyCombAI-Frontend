import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_STAT_TYPES = ['emails_today', 'linkedin_tasks_today', 'connects_today', 'messages_today'] as const;

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query param
    const { searchParams } = new URL(request.url);
    const statType = searchParams.get('type');

    if (!statType || !VALID_STAT_TYPES.includes(statType as typeof VALID_STAT_TYPES[number])) {
        return NextResponse.json(
            { error: 'Invalid stat type. Must be one of: ' + VALID_STAT_TYPES.join(', ') },
            { status: 400 }
        );
    }

    const { data, error } = await supabase.rpc('get_overview_activity_details', {
        stat_type: statType,
    });

    if (error) {
        console.error("Error fetching activity details:", error);
        return NextResponse.json({ error: "Failed to fetch activity details" }, { status: 500 });
    }

    return NextResponse.json(data);
}

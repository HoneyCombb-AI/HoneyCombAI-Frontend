import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isConnected: false }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("outlook_accounts")
            .select("email, created_at, is_connected, access_token, refresh_token")
            .eq("user_id", user.id)
            .single();

        if (error || !data) {
            // Not connected or error finding row
            return NextResponse.json({ isConnected: false });
        }

        const hasToken = !!data.refresh_token || !!data.access_token;
        if (!data.is_connected || !hasToken) {
            return NextResponse.json({ isConnected: false });
        }

        return NextResponse.json({
            isConnected: true,
            email: data.email,
            connectedAt: data.created_at,
        });
    } catch (error) {
        console.error("Error checking Outlook status:", error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}

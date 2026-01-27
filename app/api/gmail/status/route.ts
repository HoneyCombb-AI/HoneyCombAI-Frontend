import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isConnected: false, email: null }, { status: 401 });
        }

        const { data: accounts, error } = await supabase
            .from("gmail_accounts")
            .select("email, is_connected, access_token, refresh_token")
            .eq("user_id", user.id)
            .limit(1);

        if (error) {
            console.error("Status check error:", error);
            // Don't fail the whole request, just assume not connected
            return NextResponse.json({ isConnected: false, email: null });
        }

        if (accounts && accounts.length > 0) {
            const account = accounts[0];
            const hasToken = !!account.refresh_token || !!account.access_token;
            if (!account.is_connected || !hasToken) {
                return NextResponse.json({ isConnected: false, email: null });
            }

            return NextResponse.json({
                isConnected: true,
                email: account.email
            });
        }

        return NextResponse.json({ isConnected: false, email: null });

    } catch (error) {
        console.error("Status check internal error:", error);
        return NextResponse.json({ isConnected: false, email: null }, { status: 500 });
    }
}

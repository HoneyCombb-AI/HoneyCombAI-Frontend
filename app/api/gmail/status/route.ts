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
            .select("email")
            .eq("user_id", user.id)
            .limit(1);

        if (error) {
            console.error("Status check error:", error);
            // Don't fail the whole request, just assume not connected
            return NextResponse.json({ isConnected: false, email: null });
        }

        if (accounts && accounts.length > 0) {
            return NextResponse.json({
                isConnected: true,
                email: accounts[0].email
            });
        }

        return NextResponse.json({ isConnected: false, email: null });

    } catch (error) {
        console.error("Status check internal error:", error);
        return NextResponse.json({ isConnected: false, email: null }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isConnected: false, status: null, email: null }, { status: 401 });
        }

        const { data: accounts, error } = await supabase
            .from("linkedin_accounts")
            .select("status, email, error")
            .eq("user_id", user.id)
            .limit(1);

        if (error) {
            console.error("LinkedIn status check error:", error);
            return NextResponse.json({ isConnected: false, status: null, email: null, error: null });
        }

        if (accounts && accounts.length > 0) {
            const account = accounts[0];
            return NextResponse.json({
                isConnected: account.status === 'connected',
                status: account.status,
                email: account.email,
                error: account.error
            });
        }

        return NextResponse.json({ isConnected: false, status: null, email: null, error: null });

    } catch (error) {
        console.error("Status check internal error:", error);
        return NextResponse.json({ isConnected: false, status: null, email: null, error: null }, { status: 500 });
    }
}

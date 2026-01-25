import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ isConnected: false, email: null, provider: null }, { status: 401 });
        }

        // Prefer Gmail if available, otherwise Outlook (mirrors send logic)
        const { data: gmailAccount } = await supabase
            .from("gmail_accounts")
            .select("email")
            .eq("user_id", user.id)
            .maybeSingle();

        if (gmailAccount?.email) {
            return NextResponse.json({ isConnected: true, email: gmailAccount.email, provider: "gmail" });
        }

        const { data: outlookAccount } = await supabase
            .from("outlook_accounts")
            .select("email")
            .eq("user_id", user.id)
            .maybeSingle();

        if (outlookAccount?.email) {
            return NextResponse.json({ isConnected: true, email: outlookAccount.email, provider: "outlook" });
        }

        return NextResponse.json({ isConnected: false, email: null, provider: null });
    } catch (error) {
        console.error("API /api/emails/sender error:", error);
        return NextResponse.json({ isConnected: false, email: null, provider: null }, { status: 500 });
    }
}

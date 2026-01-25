import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { isConnected: false, email: null, provider: null, account_id: null, first_name: null },
                { status: 401 }
            );
        }

        const deriveFirstName = (email: string | null | undefined) => {
            if (!email) return null;
            const local = email.split("@")[0] || "";
            if (!local) return null;
            const token = local.split(/[._-]/)[0] || "";
            if (!token) return null;
            return token.charAt(0).toUpperCase() + token.slice(1);
        };

        // Prefer Gmail if available, otherwise Outlook (mirrors send logic)
        const { data: gmailAccount } = await supabase
            .from("gmail_accounts")
            .select("id, email")
            .eq("user_id", user.id)
            .maybeSingle();

        if (gmailAccount?.email && gmailAccount?.id) {
            return NextResponse.json({
                isConnected: true,
                email: gmailAccount.email,
                provider: "gmail",
                account_id: gmailAccount.id,
                first_name: deriveFirstName(gmailAccount.email),
            });
        }

        const { data: outlookAccount } = await supabase
            .from("outlook_accounts")
            .select("id, email")
            .eq("user_id", user.id)
            .maybeSingle();

        if (outlookAccount?.email && outlookAccount?.id) {
            return NextResponse.json({
                isConnected: true,
                email: outlookAccount.email,
                provider: "outlook",
                account_id: outlookAccount.id,
                first_name: deriveFirstName(outlookAccount.email),
            });
        }

        return NextResponse.json({ isConnected: false, email: null, provider: null, account_id: null, first_name: null });
    } catch (error) {
        console.error("API /api/emails/sender error:", error);
        return NextResponse.json(
            { isConnected: false, email: null, provider: null, account_id: null, first_name: null },
            { status: 500 }
        );
    }
}

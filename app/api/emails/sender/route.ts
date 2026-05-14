import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CACHE = { headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=300' } };

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
            .select("id, email, is_connected, access_token, refresh_token")
            .eq("user_id", user.id)
            .maybeSingle();

        const gmailConnected = !!gmailAccount?.is_connected &&
            (!!gmailAccount?.refresh_token || !!gmailAccount?.access_token);

        if (gmailConnected && gmailAccount?.email && gmailAccount?.id) {
            return NextResponse.json({
                isConnected: true,
                email: gmailAccount.email,
                provider: "gmail",
                account_id: gmailAccount.id,
                first_name: deriveFirstName(gmailAccount.email),
            }, CACHE);
        }

        const { data: outlookAccount } = await supabase
            .from("outlook_accounts")
            .select("id, email, is_connected, access_token, refresh_token")
            .eq("user_id", user.id)
            .maybeSingle();

        const outlookConnected = !!outlookAccount?.is_connected &&
            (!!outlookAccount?.refresh_token || !!outlookAccount?.access_token);

        if (outlookConnected && outlookAccount?.email && outlookAccount?.id) {
            return NextResponse.json({
                isConnected: true,
                email: outlookAccount.email,
                provider: "outlook",
                account_id: outlookAccount.id,
                first_name: deriveFirstName(outlookAccount.email),
            }, CACHE);
        }

        return NextResponse.json({ isConnected: false, email: null, provider: null, account_id: null, first_name: null }, CACHE);
    } catch (error) {
        console.error("API /api/emails/sender error:", error);
        return NextResponse.json(
            { isConnected: false, email: null, provider: null, account_id: null, first_name: null },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
        return NextResponse.redirect(new URL("/integration", req.url));
    }

    try {
        // 1. Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL?.trim()}/api/gmail/callback`,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            const error = await tokenRes.text();
            console.error("Token exchange failed:", error);
            return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
        }

        const tokens = await tokenRes.json();

        // 2. Get Gmail profile
        const profileRes = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            }
        );

        if (!profileRes.ok) {
            console.error("Profile fetch failed");
            return NextResponse.json({ error: "Failed to fetch Gmail profile" }, { status: 400 });
        }

        const profile = await profileRes.json();

        // 3. Get Supabase user (authenticate the session)
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 4. Store tokens using standard authenticated client
        // The table RLS policy must allow 'insert' for authenticated users with matching user_id
        const upsertData = {
            user_id: user.id,
            email: profile.emailAddress,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            scope: tokens.scope,
            token_type: tokens.token_type,
            messages_total: profile.messagesTotal,
            threads_total: profile.threadsTotal,
            history_id: profile.historyId
        };


        const { error: insertError } = await supabase.from("gmail_accounts").upsert(
            upsertData,
            { onConflict: 'user_id' }
        );

        if (insertError) {
            console.error("Database insert error:", insertError);
            return NextResponse.json({ error: "Failed to save account: " + insertError.message }, { status: 500 });
        }

        return NextResponse.redirect(new URL("/integration", req.url)); // Redirect back to integration page
    } catch (error) {
        console.error("Callback error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

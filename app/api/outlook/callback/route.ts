import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
        console.error("Outlook callback error param:", error);
        return NextResponse.redirect(new URL("/integration?error=outlook_auth_failed", req.url));
    }



    try {
        // 1. Exchange code for tokens
        const clientId = process.env.MS_CLIENT_ID!;
        const clientSecret = process.env.MS_CLIENT_SECRET!;
        const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/outlook/callback`;

        const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                scope: "User.Read Mail.Read Mail.Send offline_access",
                code: code,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                client_secret: clientSecret,
            }),
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error("Outlook token exchange failed:", errorText);
            return NextResponse.redirect(new URL("/integration?error=token_exchange_failed", req.url));
        }

        const tokens = await tokenRes.json();


        // 2. Get User Profile (to get email)
        const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!profileRes.ok) {
            console.error("Outlook profile fetch failed");
            return NextResponse.redirect(new URL("/integration?error=profile_fetch_failed", req.url));
        }

        const profile = await profileRes.json();

        const email = profile.mail || profile.userPrincipalName; // Fallback if mail is null

        // 3. Get Supabase User
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL("/integration?error=unauthorized", req.url));
        }

        // 4. Store/Update in Supabase
        // Using 'outlook_accounts' table as planned
        const upsertData = {
            user_id: user.id,
            email: email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            scope: tokens.scope,

            // New mapped fields
            outlook_id: profile.id,
            token_type: tokens.token_type,
            expires_in: tokens.expires_in,
            ext_expires_in: tokens.ext_expires_in,
            display_name: profile.displayName,
            surname: profile.surname,
            given_name: profile.givenName,
            preferred_language: profile.preferredLanguage,
            mobile_phone: profile.mobilePhone,
            job_title: profile.jobTitle,
            office_location: profile.officeLocation,
            business_phones: profile.businessPhones, // Supabase handles JSON/JSONB automatically
            user_principal_name: profile.userPrincipalName,
        };

        const { error: dbError } = await supabase
            .from("outlook_accounts")
            .upsert(upsertData, { onConflict: "user_id" });

        if (dbError) {
            console.error("Database insert error (Outlook):", dbError);
            return NextResponse.redirect(new URL("/integration?error=db_error", req.url));
        }

        // Redirect back to integration page with success
        return NextResponse.redirect(new URL("/integration?success=outlook_connected", req.url));

    } catch (err) {
        console.error("Outlook callback exception:", err);
        return NextResponse.redirect(new URL("/integration?error=server_error", req.url));
    }
}

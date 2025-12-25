import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
    try {
        // You can pass 'force_login=true' if you want to force prompt="select_account" or "login"
        // For now, we'll just stick to standard flow.

        const clientId = process.env.MS_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json(
                { error: "Missing MS_CLIENT_ID" },
                { status: 500 }
            );
        }

        // Scopes required for "read all emails" and "send emails on their behalf"
        // offline_access is needed to get a refresh_token
        const scopes = [
            "User.Read",
            "Mail.Read",
            "Mail.Send",
            "offline_access"
        ];

        const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/outlook/callback`;

        // Construct Microsoft OAuth URL
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: "code",
            redirect_uri: redirectUri,
            response_mode: "query",
            scope: scopes.join(" "),
            state: "outlook_auth", // optional verification
        });

        const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

        return NextResponse.redirect(url);
    } catch (error) {
        console.error("Outlook connect error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

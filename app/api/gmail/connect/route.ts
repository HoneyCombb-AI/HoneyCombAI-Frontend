import { NextResponse } from "next/server";

export async function GET() {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/gmail/callback`,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly"
        ].join(" "),
    });

    return NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    );
}

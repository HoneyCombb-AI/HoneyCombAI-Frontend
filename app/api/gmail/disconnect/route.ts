import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: account, error: accountError } = await supabase
            .from("gmail_accounts")
            .select("id, refresh_token, access_token")
            .eq("user_id", user.id)
            .maybeSingle();

        if (accountError) {
            console.error("Error loading Gmail account:", accountError);
            return NextResponse.json(
                { error: "Failed to disconnect Gmail account" },
                { status: 500 }
            );
        }

        if (!account?.id) {
            return NextResponse.json({
                success: true,
                message: "Gmail account already disconnected"
            });
        }

        let revocationStatus: string | null = null;
        let revokedAt: string | null = null;
        const tokenToRevoke = account.refresh_token || account.access_token;

        if (tokenToRevoke) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const revokeRes = await fetch("https://oauth2.googleapis.com/revoke", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({ token: tokenToRevoke }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (revokeRes.ok) {
                    revocationStatus = "success";
                    revokedAt = new Date().toISOString();
                } else {
                    revocationStatus = "failed";
                }
            } catch (revokeError) {
                // Covers aborts/timeouts and other fetch errors.
                console.error("Gmail token revoke error:", revokeError);
                revocationStatus = "failed";
            }
        }

        const { error } = await supabase
            .from("gmail_accounts")
            .update({
                access_token: null,
                refresh_token: null,
                token_expiry: null,
                scope: null,
                token_type: null,
                is_connected: false,
                disconnected_at: new Date().toISOString(),
                revoked_at: revokedAt,
                revocation_status: revocationStatus,
            })
            .eq("user_id", user.id);

        if (error) {
            console.error("Error disconnecting Gmail:", error);
            return NextResponse.json(
                { error: "Failed to disconnect Gmail account" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Gmail account disconnected successfully"
        });

    } catch (error) {
        console.error("Internal error disconnecting Gmail:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

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
            .from("outlook_accounts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (accountError) {
            console.error("Error loading Outlook account:", accountError);
            return NextResponse.json(
                { error: "Failed to disconnect Outlook account" },
                { status: 500 }
            );
        }

        if (!account?.id) {
            return NextResponse.json({
                success: true,
                message: "Outlook account already disconnected"
            });
        }

        // Note: Microsoft Graph revokeSignInSessions is optional and not used here.
        const { error } = await supabase
            .from("outlook_accounts")
            .update({
                access_token: null,
                refresh_token: null,
                token_expiry: null,
                scope: null,
                token_type: null,
                is_connected: false,
                disconnected_at: new Date().toISOString(),
                revoked_at: null,
                revocation_status: null,
            })
            .eq("user_id", user.id);

        if (error) {
            console.error("Error disconnecting Outlook:", error);
            return NextResponse.json(
                { error: "Failed to disconnect Outlook account" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Outlook account disconnected successfully"
        });

    } catch (error) {
        console.error("Internal error disconnecting Outlook:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

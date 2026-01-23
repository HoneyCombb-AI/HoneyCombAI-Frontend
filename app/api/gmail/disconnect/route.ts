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

        // Delete the Gmail account for this user
        const { error } = await supabase
            .from("gmail_accounts")
            .delete()
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

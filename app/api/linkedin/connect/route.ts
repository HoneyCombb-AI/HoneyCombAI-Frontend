import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // 2. Store Credentials (Upsert)
        // We use the Service Role key concept implicitly via RLS policies if configured correctly,
        // OR normally here since the user is authenticated and RLS allows "Users can insert own linkedin account".
        // Since we are using `createClient` from `@/lib/supabase/server`, it acts as the authenticated user.

        // Note: ensure your RLS policy allows UPDATE if you want upsert to work for overwrites.
        const { error } = await supabase
            .from("linkedin_accounts")
            .upsert(
                {
                    user_id: user.id,
                    email: email,
                    password: password,
                    status: "pending",
                    // created_at is default
                    // updated_at is missing in schema provided by user, so we don't set it.
                },
                { onConflict: "user_id" }
            );

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json(
                { error: "Failed to save credentials" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("LinkedIn Connect Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

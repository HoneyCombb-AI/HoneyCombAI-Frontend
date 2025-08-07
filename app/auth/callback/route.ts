import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  // Handle OAuth errors from the provider
  if (error) {
    console.error("OAuth provider error:", error, error_description);
    const errorParams = new URLSearchParams({
      error: error,
      description: error_description || "Unknown authentication error",
    });
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?${errorParams}`
    );
  }

  // Handle missing authorization code
  if (!code) {
    console.error("No authorization code received");
    const errorParams = new URLSearchParams({
      error: "missing_code",
      description:
        "No authorization code was received from the authentication provider",
    });
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?${errorParams}`
    );
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      const errorParams = new URLSearchParams({
        error: "exchange_failed",
        description: exchangeError.message,
      });
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?${errorParams}`
      );
    }

    if (!data.session) {
      console.error("No session created after code exchange");
      const errorParams = new URLSearchParams({
        error: "no_session",
        description: "Failed to create user session",
      });
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?${errorParams}`
      );
    }

    // Determine redirect URL based on environment
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectUrl: string;
    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    } else {
      redirectUrl = `${origin}${next}`;
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error in callback:", error);
    const errorParams = new URLSearchParams({
      error: "unexpected_error",
      description:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?${errorParams}`
    );
  }
}

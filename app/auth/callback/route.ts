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

    if (!data.session || !data.user) {
      console.error("No session or user created after code exchange");
      const errorParams = new URLSearchParams({
        error: "no_session",
        description: "Failed to create user session",
      });
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?${errorParams}`
      );
    }

    // Determine if this is a new user or returning user
    const user = data.user;
    const createdAt = new Date(user.created_at);
    const lastSignInAt = new Date(user.last_sign_in_at || user.created_at);
    
    // If the difference between creation and last sign-in is less than 30 seconds,
    // this is likely their first sign-in (new user)
    const isNewUser = (lastSignInAt.getTime() - createdAt.getTime()) < 30000; // 30 seconds
    
    // Auto-join new users to default organization
    if (isNewUser) {
      try {
        // Check if default organization exists
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('invite_code', 'yn8DpKxGOB4A')
          .single();

        if (defaultOrg) {
          // Check if user is already in an organization (safety check)
          const { data: existingMembership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (!existingMembership) {
            // Add user to default organization
            const { error: memberError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: defaultOrg.id,
                user_id: user.id
              });

            if (!memberError) {
              // Connect user's existing companies to organization
              await supabase.rpc('update_user_companies_organization', {
                target_user_id: user.id,
                target_organization_id: defaultOrg.id
              });
              console.log(`New user ${user.id} successfully joined default organization`);
            } else {
              console.error('Failed to add new user to default organization:', memberError);
            }
          }
        } else {
          console.warn('Default organization with invite code  not found');
        }
      } catch (error) {
        console.error('Error auto-joining new user to default organization:', error);
      }
    }

    // Determine the final destination based on user type
    let finalDestination = next;
    if (next === '/contacts') {
      finalDestination = isNewUser ? '/contacts?joyride=true' : '/contacts';
    }

    // Determine redirect URL based on environment
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectUrl: string;
    if (isLocalEnv) {
      redirectUrl = `${origin}${finalDestination}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${finalDestination}`;
    } else {
      redirectUrl = `${origin}${finalDestination}`;
    }
    
    console.log(`User ${user.id} - Created: ${user.created_at}, Last Sign-in: ${user.last_sign_in_at}, Is New: ${isNewUser}, Redirecting to: ${redirectUrl}`);
    
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

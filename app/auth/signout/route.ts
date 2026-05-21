import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function signOut(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";

  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    console.error("Error signing out on server:", error);
  }

  const response = NextResponse.redirect(redirectUrl);

  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .forEach((cookie) => {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    });

  return response;
}

export async function GET(request: NextRequest) {
  return signOut(request);
}

export async function POST(request: NextRequest) {
  return signOut(request);
}

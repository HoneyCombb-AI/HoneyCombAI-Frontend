import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimiters } from "@/app/api/utils/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Apply delete rate limiting
    const rateLimit = await rateLimiters.deletePerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Delete rate limit exceeded. Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '15',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { company_ids } = body;

    if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No company IDs provided" },
        { status: 400 }
      );
    }

    // Fetch company details to check if they exist
    const { data: companies, error: fetchError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", company_ids);

    if (fetchError) {
      console.error("Error fetching companies:", fetchError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { success: false, message: "No companies found" },
        { status: 404 }
      );
    }

    const companyIdsToDelete = companies.map((c) => c.id);
    let deleted_count = 0;

    if (companyIdsToDelete.length > 0) {
      const { error: deleteError, count } = await supabase
        .from("companies")
        .delete({ count: 'exact' })
        .in("id", companyIdsToDelete);

      if (deleteError) {
        console.error("Error deleting companies:", deleteError);
        return NextResponse.json(
          { success: false, message: "Failed to delete companies" },
          { status: 500 }
        );
      }

      // If count is null, fallback to the length of ids we tried to delete
      deleted_count = count ?? companyIdsToDelete.length;
    }

    return NextResponse.json({
      success: true,
      deleted_count,
      skipped_count: 0,
      message: `Successfully deleted ${deleted_count} company(s)`,
    });
  } catch (error) {
    console.error("Delete companies error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

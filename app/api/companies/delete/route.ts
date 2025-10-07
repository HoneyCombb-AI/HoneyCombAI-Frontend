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

    // Fetch company details to check if they can be deleted
    const { data: companies, error: fetchError } = await supabase
      .from("companies")
      .select("id, company_analysis_requested, company_analysis_completed, name")
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

    // Separate deletable and in-progress companies
    const deletableCompanies = companies.filter(
      (company) =>
        !company.company_analysis_requested || company.company_analysis_completed
    );
    const inProgressCompanies = companies.filter(
      (company) =>
        company.company_analysis_requested && !company.company_analysis_completed
    );

    const deletableIds = deletableCompanies.map((c) => c.id);
    const skippedIds = inProgressCompanies.map((c) => c.id);

    let deleted_count = 0;

    // Delete companies that are not in-progress
    if (deletableIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("companies")
        .delete()
        .in("id", deletableIds);

      if (deleteError) {
        console.error("Error deleting companies:", deleteError);
        return NextResponse.json(
          { success: false, message: "Failed to delete companies" },
          { status: 500 }
        );
      }

      deleted_count = deletableIds.length;
    }

    return NextResponse.json({
      success: true,
      deleted_count,
      skipped_count: skippedIds.length,
      message: `Successfully deleted ${deleted_count} company(s)${
        skippedIds.length > 0
          ? `. ${skippedIds.length} company(s) are in-progress and were skipped`
          : ""
      }`,
    });
  } catch (error) {
    console.error("Delete companies error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

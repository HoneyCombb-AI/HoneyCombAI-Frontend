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
    const { contact_ids } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No contact IDs provided" },
        { status: 400 }
      );
    }

    // Fetch contact details to check if they can be deleted
    const { data: contacts, error: fetchError } = await supabase
      .from("contacts")
      .select("id, primary_analysis_requested, primary_analysis_completed, full_name")
      .in("id", contact_ids);

    if (fetchError) {
      console.error("Error fetching contacts:", fetchError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: "No contacts found" },
        { status: 404 }
      );
    }

    // Separate deletable and in-progress contacts
    const deletableContacts = contacts.filter(
      (contact) =>
        !contact.primary_analysis_requested || contact.primary_analysis_completed
    );
    const inProgressContacts = contacts.filter(
      (contact) =>
        contact.primary_analysis_requested && !contact.primary_analysis_completed
    );

    const deletableIds = deletableContacts.map((c) => c.id);
    const skippedIds = inProgressContacts.map((c) => c.id);

    let deleted_count = 0;

    // Delete contacts that are not in-progress
    if (deletableIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .in("id", deletableIds);

      if (deleteError) {
        console.error("Error deleting contacts:", deleteError);
        if (deleteError.code === '23503') {
          return NextResponse.json(
            { success: false, message: "This contact can't be deleted because it has pending activity linked to it. Please resolve any pending items first." },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, message: "Failed to delete contacts" },
          { status: 500 }
        );
      }

      deleted_count = deletableIds.length;
    }

    return NextResponse.json({
      success: true,
      deleted_count,
      skipped_count: skippedIds.length,
      message: `Successfully deleted ${deleted_count} contact(s)${
        skippedIds.length > 0
          ? `. ${skippedIds.length} contact(s) are in-progress and were skipped`
          : ""
      }`,
    });
  } catch (error) {
    console.error("Delete contacts error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

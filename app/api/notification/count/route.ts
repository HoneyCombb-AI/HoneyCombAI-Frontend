import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      )
    }

    const threeDaysAgo = new Date()
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3)

    // Group by type and count distinct groups for unread notifications
    const { data: typeGroups, error: countError } = await supabase
      .from('notifications')
      .select('type')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .gte('created_at', threeDaysAgo.toISOString())

    if (countError) {
      console.error('Unread count fetch error:', countError)
      return NextResponse.json(
        { error: "Failed to fetch notification count", details: countError.message },
        { status: 500 }
      )
    }

    // Count unique types (groups)
    const uniqueTypes = new Set(typeGroups?.map(n => n.type || 'default'))
    const groupCount = uniqueTypes.size

    return NextResponse.json({
      success: true,
      unread_count: groupCount
    }, { status: 200 })

  } catch (error) {
    console.error('Notification count API error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
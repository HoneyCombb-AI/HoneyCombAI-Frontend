import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('count_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const threeDaysAgo = new Date()
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3)

    // If only count is requested, return lightweight count query
    if (countOnly) {
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
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

      return NextResponse.json({
        success: true,
        unread_count: unreadCount || 0
      }, { status: 200 })
    }

    // Fetch full notifications from past 3 days for the current user
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        id,
        text,
        type,
        batch_id,
        is_read,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .gte('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      return NextResponse.json(
        { error: "Failed to fetch notifications", details: fetchError.message },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const transformedNotifications = notifications?.map(notification => ({
      id: notification.id,
      message: notification.text,
      type: notification.type,
      batch_id: notification.batch_id,
      is_read: notification.is_read,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    })) || []

    // Get total count for pagination (past 3 days only)
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', threeDaysAgo.toISOString())

    if (countError) {
      console.error('Count fetch error:', countError)
    }

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { action, notification_id } = body

    if (action === 'mark_all_read') {
      // Mark all unread notifications as read for the user
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) {
        console.error('Mark all read error:', updateError)
        return NextResponse.json(
          { error: "Failed to mark notifications as read", details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      }, { status: 200 })

    } else if (action === 'mark_read' && notification_id) {
      // Mark specific notification as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Mark read error:', updateError)
        return NextResponse.json(
          { error: "Failed to mark notification as read", details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Notification marked as read"
      }, { status: 200 })

    } else {
      return NextResponse.json(
        { error: "Invalid action or missing notification_id" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Notification PATCH error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
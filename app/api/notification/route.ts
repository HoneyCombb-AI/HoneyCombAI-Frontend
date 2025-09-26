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
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const threeDaysAgo = new Date()
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3)

    // Fetch all notifications from past 3 days for the current user
    const { data: allNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        id,
        text,
        type,
        batch_id,
        is_read,
        created_at
      `)
      .eq('user_id', user.id)
      .gte('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      return NextResponse.json(
        { error: "Failed to fetch notifications", details: fetchError.message },
        { status: 500 }
      )
    }

    // Group notifications by type and get the most recent from each group
    const groupedNotifications = new Map()
    const groupCounts = new Map()

    allNotifications?.forEach(notification => {
      const type = notification.type || 'default'

      // Count total notifications in this group
      groupCounts.set(type, (groupCounts.get(type) || 0) + 1)

      // Keep only the most recent notification for each type (already sorted by created_at desc)
      if (!groupedNotifications.has(type)) {
        groupedNotifications.set(type, {
          id: notification.id,
          message: notification.text,
          type: notification.type,
          batch_id: notification.batch_id,
          is_read: notification.is_read,
          created_at: notification.created_at,
          group_count: 0 // Will be set below
        })
      }
    })

    // Set group counts
    groupedNotifications.forEach((notification, type) => {
      notification.group_count = groupCounts.get(type) || 1
    })

    // Convert to array and apply pagination
    const transformedNotifications = Array.from(groupedNotifications.values())
      .slice(offset, offset + limit)

    // Get total count of groups (past 3 days only)
    const totalGroups = groupedNotifications.size

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      pagination: {
        total: totalGroups,
        limit,
        offset,
        hasMore: totalGroups > offset + limit
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
    const { action, notification_id, notification_type } = body

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

    } else if (action === 'mark_group_read' && notification_type) {
      // Mark all notifications of a specific type as read for the user
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('type', notification_type)
        .eq('is_read', false)

      if (updateError) {
        console.error('Mark group read error:', updateError)
        return NextResponse.json(
          { error: "Failed to mark group as read", details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Group notifications marked as read"
      }, { status: 200 })

    } else {
      return NextResponse.json(
        { error: "Invalid action or missing required parameters" },
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
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

    // Separate notifications by read status
    const unreadNotifications = allNotifications?.filter(n => !n.is_read) || []
    const readNotifications = allNotifications?.filter(n => n.is_read) || []

    // Group unread notifications by type
    const unreadGroups = new Map()
    const unreadCounts = new Map()

    unreadNotifications.forEach(notification => {
      const type = notification.type || 'default'
      unreadCounts.set(type, (unreadCounts.get(type) || 0) + 1)

      if (!unreadGroups.has(type)) {
        unreadGroups.set(type, {
          id: notification.id,
          message: notification.text,
          type: notification.type,
          batch_id: notification.batch_id,
          is_read: false,
          created_at: notification.created_at,
          group_count: 0
        })
      }
    })

    // Set group counts for unread
    unreadGroups.forEach((notification, type) => {
      notification.group_count = unreadCounts.get(type) || 1
    })

    // Group read notifications by type
    const readGroups = new Map()
    const readCounts = new Map()

    readNotifications.forEach(notification => {
      const type = notification.type || 'default'
      readCounts.set(type, (readCounts.get(type) || 0) + 1)

      if (!readGroups.has(type)) {
        readGroups.set(type, {
          id: notification.id,
          message: notification.text,
          type: notification.type,
          batch_id: notification.batch_id,
          is_read: true,
          created_at: notification.created_at,
          group_count: 0
        })
      }
    })

    // Set group counts for read
    readGroups.forEach((notification, type) => {
      notification.group_count = readCounts.get(type) || 1
    })

    // Combine unread first (priority), then read notifications
    const combinedGroups = [
      ...Array.from(unreadGroups.values()),
      ...Array.from(readGroups.values())
    ]

    // Apply pagination
    const transformedNotifications = combinedGroups.slice(offset, offset + limit)

    // Get total count of groups (past 3 days only)
    const totalGroups = combinedGroups.length

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
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

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch notifications for contacts belonging to the current user
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        id,
        notification,
        created_at,
        updated_at,
        contacts!inner (
          id,
          full_name,
          email,
          profile_picture,
          user_id
        )
      `)
      .eq('contacts.user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      return NextResponse.json(
        { error: "Failed to fetch notifications", details: fetchError.message },
        { status: 500 }
      )
    }

    // Transform the data to include contact info at the top level
    const transformedNotifications = notifications?.map(notification => {
      const contact = Array.isArray(notification.contacts) 
        ? notification.contacts[0] 
        : notification.contacts;
      
      return {
        id: notification.id,
        message: notification.notification,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
        contact: {
          id: contact?.id || '',
          full_name: contact?.full_name || '',
          email: contact?.email || '',
          profile_picture: contact?.profile_picture || null
        }
      };
    }) || []

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('contacts.user_id', user.id)

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
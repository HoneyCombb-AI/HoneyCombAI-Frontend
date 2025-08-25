import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    // Parse the request body (final enriched onboarding data)
    const clientContextData = await request.json()

    // Validate that we have the required onboarding data
    if (!clientContextData || typeof clientContextData !== 'object') {
      return NextResponse.json(
        { error: "Invalid client context data provided" },
        { status: 400 }
      )
    }

    // Required fields validation
    const requiredFields = [
      'company_name',
      'industry', 
      'business_focus',
      'target_market',
      'intent_priorities',
      'client_specific_guidance',
      'industry_context',
      'success_metrics'
    ]

    const missingFields = requiredFields.filter(field => !clientContextData[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Update the user's profile with client context and mark as onboarded
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        client_context: clientContextData,
        is_onboarded: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: "Failed to save onboarding data", details: updateError.message },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Client context saved successfully and onboarding completed",
      data: {
        user_id: user.id,
        is_onboarded: true,
        client_context: updatedProfile.client_context
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Client context API error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET method to retrieve current client context (optional)
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

    // Get the user's onboarding status
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('is_onboarded')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Database fetch error:', fetchError)
      return NextResponse.json(
        { error: "Failed to fetch onboarding status", details: fetchError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      is_onboarded: profile.is_onboarded
    }, { status: 200 })

  } catch (error) {
    console.error('Client context GET API error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
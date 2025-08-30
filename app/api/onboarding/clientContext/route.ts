import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface OrganizationStatus {
  has_organization: boolean;
  organization_id: string | null;
  organization_name: string | null;
  is_organization_onboarded: boolean;
}

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

    // Check user's organization membership first
    const { data: orgStatus, error: orgStatusError } = await supabase
      .rpc('check_user_organization_status', { input_user_id: user.id })
      .single() as { data: OrganizationStatus | null; error: unknown };

    if (orgStatusError) {
      console.error('Error checking organization status:', orgStatusError);
      return NextResponse.json(
        { error: "Failed to check organization status" },
        { status: 500 }
      );
    }

    // Check if user is part of an organization
    if (!orgStatus || !orgStatus.has_organization) {
      return NextResponse.json(
        { error: 'You are not part of an organization. You need to create or join an organization first.' },
        { status: 403 }
      );
    }

    // Update the organization with client context and mark as onboarded
    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update({
        client_context: clientContextData,
        is_onboarded: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgStatus.organization_id)
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
      message: "Client context saved successfully and organization onboarding completed",
      data: {
        user_id: user.id,
        organization_id: orgStatus.organization_id,
        organization_name: orgStatus.organization_name,
        is_onboarded: true,
        client_context: updatedOrganization.client_context
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

// GET method to retrieve organization onboarding status
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

    // Check user's organization membership and onboarding status
    const { data: orgStatus, error: orgStatusError } = await supabase
      .rpc('check_user_organization_status', { input_user_id: user.id })
      .single() as { data: OrganizationStatus | null; error: unknown };

    if (orgStatusError) {
      console.error('Error checking organization status:', orgStatusError);
      return NextResponse.json(
        { error: "Failed to check organization status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      has_organization: orgStatus?.has_organization || false,
      organization_id: orgStatus?.organization_id || null,
      organization_name: orgStatus?.organization_name || null,
      is_onboarded: orgStatus?.is_organization_onboarded || false
    }, { status: 200 })

  } catch (error) {
    console.error('Client context GET API error:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
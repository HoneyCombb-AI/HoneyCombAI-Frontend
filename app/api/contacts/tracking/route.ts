import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TrackingRequest {
  contact_ids: string[];
  action: 'enable' | 'disable' | 'toggle';
}

interface TrackingResponse {
  success: boolean;
  message: string;
  updated_contacts: Array<{
    id: string;
    isTracked: boolean;
  }>;
  errors?: Array<{
    field?: string;
    message: string;
    error_code?: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackingRequest = await req.json();
    
    // Validate request structure
    if (!body.contact_ids || !Array.isArray(body.contact_ids) || body.contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'contact_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!body.action || !['enable', 'disable', 'toggle'].includes(body.action)) {
      return NextResponse.json(
        { success: false, message: 'action must be "enable", "disable", or "toggle"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get user from auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify contact IDs exist and belong to the user's organization
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, isTracked')
      .in('id', body.contact_ids);

    if (contactsError) {
      return NextResponse.json(
        { success: false, message: 'Error validating contact IDs' },
        { status: 500 }
      );
    }

    const foundContacts = contacts || [];
    const foundContactIds = foundContacts.map(c => c.id);
    const missingIds = body.contact_ids.filter(id => !foundContactIds.includes(id));
    
    if (missingIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Contact IDs not found: ${missingIds.join(', ')}` 
        },
        { status: 404 }
      );
    }

    // Determine the updates needed based on action
    const updatedContacts: Array<{ id: string; isTracked: boolean }> = [];
    
    for (const contact of foundContacts) {
      let newTrackingState: boolean;
      
      switch (body.action) {
        case 'enable':
          newTrackingState = true;
          break;
        case 'disable':
          newTrackingState = false;
          break;
        case 'toggle':
          newTrackingState = !contact.isTracked;
          break;
        default:
          continue;
      }
      
      // Only update if the state is changing
      if (newTrackingState !== contact.isTracked) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ isTracked: newTrackingState })
          .eq('id', contact.id);

        if (updateError) {
          console.error(`Error updating contact ${contact.id}:`, updateError);
          continue;
        }
        
        updatedContacts.push({
          id: contact.id,
          isTracked: newTrackingState
        });
      }
    }

    // Generate success message
    let message = '';
    const enabledCount = updatedContacts.filter(c => c.isTracked).length;
    const disabledCount = updatedContacts.filter(c => !c.isTracked).length;
    
    if (body.action === 'toggle') {
      const parts = [];
      if (enabledCount > 0) parts.push(`${enabledCount} contact(s) enabled`);
      if (disabledCount > 0) parts.push(`${disabledCount} contact(s) disabled`);
      message = `Tracking updated: ${parts.join(', ')}`;
    } else if (body.action === 'enable') {
      message = `Tracking enabled for ${updatedContacts.length} contact(s)`;
    } else if (body.action === 'disable') {
      message = `Tracking disabled for ${updatedContacts.length} contact(s)`;
    }

    if (updatedContacts.length === 0) {
      message = 'No changes needed - contacts already in requested state';
    }

    return NextResponse.json({
      success: true,
      message,
      updated_contacts: updatedContacts
    } as TrackingResponse);

  } catch (error: unknown) {
    console.error('API /api/contacts/tracking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      message: errorMessage,
      updated_contacts: [],
      errors: [{ message: errorMessage }]
    } as TrackingResponse, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import { getWorkflowTokenCost, TaskType } from '@/app/api/utils/cost-estimation';

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

interface RPCResult {
  id: string;
  is_tracked: boolean;
  was_updated: boolean;
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

    // Apply enrichment rate limiting (tracking is a form of enrichment)
    const rateLimit = await rateLimiters.enrichmentPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Enrichment rate limit exceeded. Please wait before trying again.',
          errors: [{ message: `Rate limit exceeded. You can try again at ${new Date(rateLimit.resetTime).toLocaleString()}` }]
        } as TrackingResponse,
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Verify contact IDs exist and get their companies with tracking states
    // Only contacts with companies can be tracked
    const { data: contactsWithCompanies, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        id,
        company_id,
        companies!inner(id, istracked)
      `)
      .in('id', body.contact_ids)
      .not('company_id', 'is', null);

    if (contactsError) {
      return NextResponse.json(
        { success: false, message: 'Error validating contact IDs' },
        { status: 500 }
      );
    }

    const foundContacts = contactsWithCompanies || [];
    const foundContactIds = foundContacts.map(c => c.id);
    const missingIds = body.contact_ids.filter(id => !foundContactIds.includes(id));

    if (missingIds.length > 0) {
      // Check if missing IDs are personal contacts (no company)
      const { data: personalContacts } = await supabase
        .from('contacts')
        .select('id')
        .in('id', missingIds)
        .is('company_id', null);

      if (personalContacts && personalContacts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot track personal contacts (contacts without a company): ${personalContacts.map(c => c.id).join(', ')}`
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: `Contact IDs not found: ${missingIds.join(', ')}`
        },
        { status: 404 }
      );
    }

    // Get unique companies to calculate token cost (track at company level, not per contact)
    const uniqueCompanies = new Map<string, boolean>();
    foundContacts.forEach(contact => {
      if (contact.company_id && contact.companies) {
        const companyData = Array.isArray(contact.companies) ? contact.companies[0] : contact.companies;
        uniqueCompanies.set(contact.company_id, companyData.istracked);
      }
    });

    let companiesToEnable = 0;

    if (body.action === 'enable') {
      companiesToEnable = Array.from(uniqueCompanies.values()).filter(tracked => !tracked).length;
    } else if (body.action === 'disable') {
      companiesToEnable = 0;
    } else if (body.action === 'toggle') {
      companiesToEnable = Array.from(uniqueCompanies.values()).filter(tracked => !tracked).length;
    }

    const totalTokens = getWorkflowTokenCost(TaskType.SIGNALS_AGENT, companiesToEnable);
    if (totalTokens > 0) {
      const { data: tokenCheck, error: tokenError } = await supabase
        .rpc('check_user_tokens', {
          input_user_id: user.id
        });

      if (tokenError) {
        return NextResponse.json({
          success: false,
          message: 'Error checking token balance',
          errors: [{ message: tokenError.message }]
        } as TrackingResponse, { status: 500 });
      }

      const tokenData = tokenCheck?.[0];
      if (!tokenData?.can_use_tokens) {
        return NextResponse.json({
          success: false,
          message: 'User token limit reached',
          errors: [{ message: 'You have reached your token usage limit' }]
        } as TrackingResponse, { status: 403 });
      }

      if (tokenData.available_tokens < totalTokens) {
        return NextResponse.json({
          success: false,
          message: 'Insufficient tokens',
          errors: [{
            message: `Not enough tokens available. Need ${totalTokens}, have ${tokenData.available_tokens}`
          }]
        } as TrackingResponse, { status: 403 });
      }
    }
    // Use RPC function for optimized bulk update
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('update_contact_tracking', {
        contact_ids: body.contact_ids,
        action_type: body.action
      });

    if (rpcError) {
      console.error('Error updating contact tracking:', rpcError);
      return NextResponse.json({
        success: false,
        message: 'Error updating contact tracking',
        errors: [{ message: rpcError.message }]
      } as TrackingResponse, { status: 500 });
    }

    // Filter to get only the contacts that were actually updated
    const updatedContacts = (rpcResults as RPCResult[] || [])
      .filter((result: RPCResult) => result.was_updated)
      .map((result: RPCResult) => ({
        id: result.id,
        isTracked: result.is_tracked
      }));

    // Generate success message
    let message = '';
    const enabledCount = updatedContacts.filter((c: { id: string; isTracked: boolean }) => c.isTracked).length;
    const disabledCount = updatedContacts.filter((c: { id: string; isTracked: boolean }) => !c.isTracked).length;

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
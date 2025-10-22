import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import { getWorkflowTokenCost, TaskType } from '@/app/api/utils/cost-estimation';

interface TrackingRequest {
  company_ids: string[];
  action: 'enable' | 'disable' | 'toggle';
}

interface TrackingResponse {
  success: boolean;
  message: string;
  updated_companies: number;
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
    if (!body.company_ids || !Array.isArray(body.company_ids) || body.company_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'company_ids must be a non-empty array', updated_companies: 0 },
        { status: 400 }
      );
    }

    if (!body.action || !['enable', 'disable', 'toggle'].includes(body.action)) {
      return NextResponse.json(
        { success: false, message: 'action must be "enable", "disable", or "toggle"', updated_companies: 0 },
        { status: 400 }
      );
    }

    // Deduplicate company IDs to prevent processing the same company multiple times
    const uniqueCompanyIds = Array.from(new Set(body.company_ids));

    const supabase = await createClient();

    // Get user from auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', updated_companies: 0 },
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
          updated_companies: 0,
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

    // Verify company IDs exist and get their current tracking states
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, istracked')
      .in('id', uniqueCompanyIds);

    if (companiesError) {
      return NextResponse.json(
        { success: false, message: 'Error validating company IDs', updated_companies: 0 },
        { status: 500 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid company IDs found',
          updated_companies: 0
        },
        { status: 404 }
      );
    }

    const foundCompanyIds = companies.map(c => c.id);
    const missingIds = body.company_ids.filter(id => !foundCompanyIds.includes(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Company IDs not found: ${missingIds.join(', ')}`,
          updated_companies: 0
        },
        { status: 404 }
      );
    }

    // Calculate token cost based on companies being enabled
    let companiesToEnable = 0;

    if (body.action === 'enable') {
      companiesToEnable = companies.filter(c => !c.istracked).length;
    } else if (body.action === 'disable') {
      companiesToEnable = 0;
    } else if (body.action === 'toggle') {
      companiesToEnable = companies.filter(c => !c.istracked).length;
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
          updated_companies: 0,
          errors: [{ message: tokenError.message }]
        } as TrackingResponse, { status: 500 });
      }

      const tokenData = tokenCheck?.[0];
      if (!tokenData?.can_use_tokens) {
        return NextResponse.json({
          success: false,
          message: 'User token limit reached',
          updated_companies: 0,
          errors: [{ message: 'You have reached your token usage limit' }]
        } as TrackingResponse, { status: 403 });
      }

      if (tokenData.available_tokens < totalTokens) {
        return NextResponse.json({
          success: false,
          message: 'Insufficient tokens',
          updated_companies: 0,
          errors: [{
            message: `Not enough tokens available. Need ${totalTokens}, have ${tokenData.available_tokens}`
          }]
        } as TrackingResponse, { status: 403 });
      }
    }

    // Determine new tracking value for each action
    let newTrackingValue: boolean | null = null;

    if (body.action === 'enable') {
      newTrackingValue = true;
    } else if (body.action === 'disable') {
      newTrackingValue = false;
    }

    let updateQuery;
    let actualChanges = 0;

    if (body.action === 'toggle') {
      // For toggle, simply flip the tracking state for each company
      const updatePromises = companies.map(async company => {
        const { error } = await supabase
          .from('companies')
          .update({ istracked: !company.istracked })
          .eq('id', company.id);
        if (!error) actualChanges++;
        return { error };
      });

      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);

      if (hasError) {
        return NextResponse.json({
          success: false,
          message: 'Error updating company tracking',
          updated_companies: 0,
          errors: [{ message: 'Failed to toggle tracking for some companies' }]
        } as TrackingResponse, { status: 500 });
      }

      // Count how many were enabled/disabled after the toggle
      const { data: updatedCompanies } = await supabase
        .from('companies')
        .select('id, istracked')
        .in('id', uniqueCompanyIds);

      const enabledCount = updatedCompanies?.filter(c => c.istracked).length || 0;
      const disabledCount = (updatedCompanies?.length || 0) - enabledCount;

      const parts = [];
      if (enabledCount > 0) {
        const enableText = enabledCount === 1 ? 'company' : 'companies';
        parts.push(`${enabledCount} ${enableText} enabled`);
      }
      if (disabledCount > 0) {
        const disableText = disabledCount === 1 ? 'company' : 'companies';
        parts.push(`${disabledCount} ${disableText} disabled`);
      }

      return NextResponse.json({
        success: true,
        message: `Tracking updated: ${parts.join(' and ')}`,
        updated_companies: companies.length
      } as TrackingResponse);
    } else {
      // Handle enable/disable cases
      const { error: updateError, count } = await supabase
        .from('companies')
        .update({ istracked: newTrackingValue })
        .in('id', uniqueCompanyIds);

      if (updateError) {
        console.error('Error updating company tracking:', updateError);
        return NextResponse.json({
          success: false,
          message: 'Error updating company tracking',
          updated_companies: 0,
          errors: [{ message: updateError.message }]
        } as TrackingResponse, { status: 500 });
      }

      const companyText = uniqueCompanyIds.length === 1 ? 'company' : 'companies';
      const message = body.action === 'enable'
        ? `Tracking enabled for ${uniqueCompanyIds.length} ${companyText}`
        : `Tracking disabled for ${uniqueCompanyIds.length} ${companyText}`;

      return NextResponse.json({
        success: true,
        message,
        updated_companies: count || 0
      } as TrackingResponse);
    }

  } catch (error: unknown) {
    console.error('API /api/contacts/tracking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      message: errorMessage,
      updated_companies: 0,
      errors: [{ message: errorMessage }]
    } as TrackingResponse, { status: 500 });
  }
}
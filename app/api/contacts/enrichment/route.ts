import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowTokenCost, TaskType } from '@/app/api/utils/cost-estimation';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import axios from 'axios';

interface EnrichmentRequest {
  entity_ids: string[];
  entity_type: 'contact_id';
  task_type: TaskType;
  payload?: {
    personalization?: string;
    tonality?: string;
  };
}

interface EnrichmentResponse {
  success: boolean;
  message: string;
  tokens_used?: number;
  request_id?: string;
  errors?: Array<{
    field?: string;
    message: string;
    error_code?: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: EnrichmentRequest = await req.json();
    
    // Validate request structure
    if (!body.entity_ids || !Array.isArray(body.entity_ids) || body.entity_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'entity_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (body.entity_type !== 'contact_id') {
      return NextResponse.json(
        { success: false, message: 'entity_type must be "contact_id" for contacts endpoint' },
        { status: 400 }
      );
    }

    if (!body.task_type || !Object.values(TaskType).includes(body.task_type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid task_type. Must be one of the supported workflow types.' },
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

    // Apply enrichment rate limiting
    const rateLimit = await rateLimiters.enrichmentPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Enrichment rate limit exceeded. Please wait before trying again.',
          errors: [{ message: `Rate limit exceeded. You can try again at ${new Date(rateLimit.resetTime).toLocaleString()}` }]
        } as EnrichmentResponse,
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
    // Calculate cost using our internal utility
    const totalTokens = getWorkflowTokenCost(body.task_type, body.entity_ids.length);

    // Check user token balance and permissions
    const { data: tokenCheck, error: tokenError } = await supabase
      .rpc('check_user_tokens', {
        input_user_id: user.id
      });
    if (tokenError) {
      return NextResponse.json({
        success: false,
        message: 'Error checking token balance',
        errors: [{ message: tokenError.message }]
      } as EnrichmentResponse, { status: 500 });
    }
    const tokenData = tokenCheck?.[0]; 
    if (!tokenData?.can_use_tokens) {
      return NextResponse.json({
        success: false,
        message: 'User token limit reached',
        errors: [{ message: 'You have reached your token usage limit' }]
      } as EnrichmentResponse, { status: 403 });
    }
    if (tokenData.available_tokens < totalTokens) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient tokens',
        errors: [{ 
          message: `Not enough tokens available. Need ${totalTokens}, have ${tokenData.available_tokens}` 
        }]
      } as EnrichmentResponse, { status: 403 });
    }
    
    // Verify user exists and get their current token balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, "UserTier"')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Combined validation: existence + business rules in single query
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, primary_analysis_completed')
      .in('id', body.entity_ids);

    if (contactsError) {
      return NextResponse.json(
        { success: false, message: 'Error validating contacts' },
        { status: 500 }
      );
    }

    const foundContacts = contacts || [];
    const foundContactIds = foundContacts.map(c => c.id);

    // Check for missing contacts (existence validation)
    const missingIds = body.entity_ids.filter(id => !foundContactIds.includes(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Contact IDs not found: ${missingIds.join(', ')}` 
        },
        { status: 404 }
      );
    }

    // Check for business rule validation based on task type
    if (body.task_type === 'outreach_generation') {
      // For outreach generation, contacts MUST have completed primary analysis
      const ineligibleContacts = foundContacts.filter(c => !c.primary_analysis_completed);
      if (ineligibleContacts.length > 0) {
        const ineligibleIds = ineligibleContacts.map(c => c.id);
        return NextResponse.json({
          success: false,
          message: `Cannot generate outreach - primary analysis not completed for: ${ineligibleIds.join(', ')}`,
          errors: [{
            message: `Contacts must have completed primary analysis before outreach generation`
          }]
        } as EnrichmentResponse, { status: 400 });
      }
    } else {
      // For other enrichment types, contacts must NOT have completed primary analysis
      const ineligibleContacts = foundContacts.filter(c => c.primary_analysis_completed);
      if (ineligibleContacts.length > 0) {
        const ineligibleIds = ineligibleContacts.map(c => c.id);
        return NextResponse.json({
          success: false,
          message: `Cannot enrich contacts - primary analysis already completed for: ${ineligibleIds.join(', ')}`,
          errors: [{
            message: `Contacts with completed primary analysis cannot be enriched again`
          }]
        } as EnrichmentResponse, { status: 400 });
      }
    }
    
    // Forward request to external backend
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { success: false, message: 'AI enrichment not configured' },
        { status: 500 }
      );
    }

    const requestData = {
      ...body,
      user_id: user.id,
      user_tier: profile.UserTier || 'basic'
    };

    try {
      const backendResponse = await axios.post(`${backendUrl}/api/v1/workflows/submit`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const backendResult = backendResponse.data;

      // Handle different backend response formats
      if (backendResult.status === 'success') {
        // Only update primary_analysis_requested for complete_contact_workflow
        if (body.task_type === 'complete_contact_workflow') {
          const { error: updateError } = await supabase
            .from('contacts')
            .update({ primary_analysis_requested: true })
            .in('id', body.entity_ids);
          if (updateError) {
            console.error('Error updating primary_analysis_requested:', updateError);
          }
        }

        // Generate task-specific success messages
        const taskMessages: Record<string, string> = {
          'complete_contact_workflow': `Contact enrichment initiated for ${body.entity_ids.length} contact${body.entity_ids.length > 1 ? 's' : ''}`,
          'outreach_generation': `Personalized outreach generation started for ${body.entity_ids.length} contact${body.entity_ids.length > 1 ? 's' : ''}`,
          'signals_agent': `Signal tracking enabled for ${body.entity_ids.length} contact${body.entity_ids.length > 1 ? 's' : ''}`
        };

        const customMessage = taskMessages[body.task_type] || backendResult.message || 'Request submitted successfully';

        return NextResponse.json({
          success: true,
          message: customMessage,
          tokens_used: totalTokens,
          request_id: backendResult.workflow?.workflow_id || backendResult.request_id
        } as EnrichmentResponse);
      } else {
        return NextResponse.json({
          success: false,
          message: backendResult.message || 'Enrichment processing failed',
          errors: backendResult.errors || [{ message: 'Unknown Enrichment error' }]
        } as EnrichmentResponse, { status: 400 });
      }
    } catch (error: unknown) {
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        if (status === 404) {
          return NextResponse.json({
            success: false,
            message: 'Enrichment service is currently unavailable',
            errors: [{ message: 'Our AI enrichment service is temporarily down. Please try again after sometime.' }]
          } as EnrichmentResponse, { status: 503 });
        }
        
        if (status && status >= 500) {
          return NextResponse.json({
            success: false,
            message: 'Enrichment service error',
            errors: [{ message: 'Something went wrong on our end. Please try again later.' }]
          } as EnrichmentResponse, { status: 503 });
        }
        
        if (status === 429) {
          return NextResponse.json({
            success: false,
            message: 'Too many requests',
            errors: [{ message: 'Please wait a moment before trying again.' }]
          } as EnrichmentResponse, { status: 429 });
        }

        return NextResponse.json({
          success: false,
          message: 'Unable to process enrichment request',
          errors: [{ message: 'Please check your contact selection and try again. If the issue persists, contact support.' }]
        } as EnrichmentResponse, { status: 400 });
      }
      
      // Handle non-Axios errors
      console.error('API /api/v1/workflows/submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json({
        success: false,
        message: errorMessage,
        errors: [{ message: errorMessage }]
      } as EnrichmentResponse, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('API /api/contacts/enrichment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      message: errorMessage,
      errors: [{ message: errorMessage }]
    } as EnrichmentResponse, { status: 500 });
  }
}
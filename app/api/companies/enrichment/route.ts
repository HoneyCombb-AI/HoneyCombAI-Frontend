import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowTokenCost, TaskType } from '@/app/api/utils/cost-estimation';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import axios from 'axios';

interface EnrichmentRequest {
  entity_ids: string[];
  entity_type: 'company_id';
  task_type: TaskType;
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

    if (body.entity_type !== 'company_id') {
      return NextResponse.json(
        { success: false, message: 'entity_type must be "company_id" for companies endpoint' },
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
          errors: [{ message: `You can try again at ${new Date(rateLimit.resetTime).toISOString()}` }]
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

    // Verify company IDs exist and belong to the user's organization
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .in('id', body.entity_ids);

    if (companiesError) {
      return NextResponse.json(
        { success: false, message: 'Error validating company IDs' },
        { status: 500 }
      );
    }

    const foundCompanyIds = companies?.map(c => c.id) || [];
    const missingIds = body.entity_ids.filter(id => !foundCompanyIds.includes(id));
    
    if (missingIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Company IDs not found: ${missingIds.join(', ')}` 
        },
        { status: 404 }
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

    // RPC returns an array, get first element
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
        return NextResponse.json({
          success: true,
          message: backendResult.message || 'Enrichment request submitted successfully',
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
        
        // For all other errors (400s, etc.)
        return NextResponse.json({
          success: false,
          message: 'Unable to process enrichment request',
          errors: [{ message: 'Please check your company selection and try again. If the issue persists, contact support.' }]
        } as EnrichmentResponse, { status: 400 });
      }
      
      // Handle non-Axios errors
      console.error('API /api/companies/enrichment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json({
        success: false,
        message: errorMessage,
        errors: [{ message: errorMessage }]
      } as EnrichmentResponse, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('API /api/companies/enrichment outer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      message: errorMessage,
      errors: [{ message: errorMessage }]
    } as EnrichmentResponse, { status: 500 });
  }
}
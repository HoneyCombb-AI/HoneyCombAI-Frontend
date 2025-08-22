import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowTokenCost, TaskType } from '../../utils/cost-estimation';

interface EnrichmentRequest {
  entity_ids: string[];
  entity_type: 'company_id';
  user_id: string;
  user_tier: 'vip';
  task_type: TaskType;
}

interface EnrichmentResponse {
  success: boolean;
  message: string;
  cost_estimate: {
    tokens_per_entity: number;
    total_entities: number;
    total_tokens: number;
    task_type: string;
  };
  request_id?: string;
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

    if (!body.user_id || typeof body.user_id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'user_id is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.user_tier !== 'vip') {
      return NextResponse.json(
        { success: false, message: 'user_tier must be "vip"' },
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
    
    // Verify user exists and get their current token balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tier')
      .eq('id', body.user_id)
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
    const tokensPerEntity = getWorkflowTokenCost(body.task_type, 1);

    const costEstimate = {
      tokens_per_entity: tokensPerEntity,
      total_entities: body.entity_ids.length,
      total_tokens: totalTokens,
      task_type: body.task_type
    };

    // TODO: Check if user has sufficient tokens (implement when token system is ready)
    
    // Forward request to external backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { success: false, message: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    const backendResponse = await fetch(`${backendUrl}/enrichment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend request failed: ${errorText}`,
          cost_estimate: costEstimate
        },
        { status: backendResponse.status }
      );
    }

    const backendResult = await backendResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Enrichment request submitted successfully',
      cost_estimate: costEstimate,
      request_id: backendResult.request_id || undefined
    } as EnrichmentResponse);

  } catch (error: unknown) {
    console.error('API /api/companies/enrichment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
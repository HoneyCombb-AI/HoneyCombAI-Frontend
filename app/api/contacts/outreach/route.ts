import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkflowTokenCost, TaskType } from '@/app/api/utils/cost-estimation';
import { rateLimiters } from '@/app/api/utils/rate-limiter';
import axios from 'axios';

interface OutreachRequest {
    entity_ids: string[];
    entity_type: 'contact_id';
    task_type: TaskType;
    payload?: {
        personalization?: string;
        tonality?: string;
        enrichment_type?: string;
    }
}

interface OutreachResponse {
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
        const body: OutreachRequest = await req.json();

        // ## 1. Initial Request Validation
        if (!body.entity_ids || !Array.isArray(body.entity_ids) || body.entity_ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'entity_ids must be a non-empty array' },
                { status: 400 }
            );
        }

        if (body.entity_type !== 'contact_id') {
            return NextResponse.json(
                { success: false, message: 'entity_type must be "contact_id" for this endpoint' },
                { status: 400 }
            );
        }

        if (!body.task_type || !Object.values(TaskType).includes(body.task_type)) {
            return NextResponse.json(
                { success: false, message: 'Invalid task_type provided.' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // ## 2. User Authentication and Authorization
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // ## 3. Rate Limiting
        const rateLimit = await rateLimiters.enrichmentPerUser(user.id);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Rate limit exceeded. Please wait before trying again.',
                    errors: [{ message: `You can try again at ${new Date(rateLimit.resetTime).toLocaleString()}` }]
                } as OutreachResponse,
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

        // ## 4. Token and Cost Calculation
        const totalTokens = getWorkflowTokenCost(body.task_type, body.entity_ids.length);

        const { data: tokenCheck, error: tokenError } = await supabase
            .rpc('check_user_tokens', { input_user_id: user.id });
        if (tokenError) {
            return NextResponse.json({
                success: false,
                message: 'Error checking token balance',
                errors: [{ message: tokenError.message }]
            } as OutreachResponse, { status: 500 });
        }

        const tokenData = tokenCheck?.[0];
        if (!tokenData?.can_use_tokens || tokenData.available_tokens < totalTokens) {
            const message = !tokenData?.can_use_tokens ? 'User token limit reached' : 'Insufficient tokens';
            const errorMessage = !tokenData?.can_use_tokens
                ? 'You have reached your token usage limit'
                : `Not enough tokens available. Need ${totalTokens}, have ${tokenData.available_tokens}`;
            return NextResponse.json({
                success: false,
                message,
                errors: [{ message: errorMessage }]
            } as OutreachResponse, { status: 403 });
        }

        // ## 5. Profile and Contact Validation
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

        const missingIds = body.entity_ids.filter(id => !foundContactIds.includes(id));
        if (missingIds.length > 0) {
            return NextResponse.json(
                { success: false, message: `Contact IDs not found: ${missingIds.join(', ')}` },
                { status: 404 }
            );
        }

        // ## 6. Outreach-Specific Validation
        // For outreach, primary analysis MUST BE completed.
        const ineligibleContacts = foundContacts.filter(c => !c.primary_analysis_completed);
        if (ineligibleContacts.length > 0) {
            const ineligibleIds = ineligibleContacts.map(c => c.id);
            return NextResponse.json({
                success: false,
                message: `Cannot generate outreach for contacts without completed primary analysis: ${ineligibleIds.join(', ')}`,
                errors: [{ message: `Primary analysis must be completed before generating outreach.` }]
            } as OutreachResponse, { status: 400 });
        }

        // ## 7. Forward to External Backend
        const backendUrl = process.env.BACKEND_URL;
        if (!backendUrl) {
            return NextResponse.json(
                { success: false, message: 'AI enrichment service not configured' },
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
                headers: { 'Content-Type': 'application/json' }
            });
            const backendResult = backendResponse.data;

            if (backendResult.status === 'success') {
                // Update outreach_requested field
                const { error: updateError } = await supabase
                    .from('contacts')
                    .update({ outreach_requested: true })
                    .in('id', body.entity_ids);
                if (updateError) {
                    console.error('Error updating outreach_requested:', updateError);
                }

                const customMessage = `Outreach generation initiated for ${body.entity_ids.length} contact${body.entity_ids.length > 1 ? 's' : ''}`;

                return NextResponse.json({
                    success: true,
                    message: customMessage,
                    tokens_used: totalTokens,
                    request_id: backendResult.workflow?.workflow_id || backendResult.request_id
                } as OutreachResponse);
            } else {
                return NextResponse.json({
                    success: false,
                    message: backendResult.message || 'Processing failed on the backend',
                    errors: backendResult.errors || [{ message: 'Unknown backend error' }]
                } as OutreachResponse, { status: 400 });
            }
        } catch (error: unknown) {
            // ## 8. Error Handling
            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                let message = 'Unable to process outreach request';
                let errorMessage = 'An unexpected error occurred.';

                if (status === 404) {
                    message = 'Outreach service is currently unavailable';
                    errorMessage = 'Our AI outreach service is temporarily down. Please try again later.';
                    return NextResponse.json({ success: false, message, errors: [{ message: errorMessage }] } as OutreachResponse, { status: 503 });
                }
                if (status >= 500) {
                    message = 'Outreach service error';
                    errorMessage = 'Something went wrong on our end. Please try again later.';
                    return NextResponse.json({ success: false, message, errors: [{ message: errorMessage }] } as OutreachResponse, { status: 503 });
                }
                if (status === 429) {
                    message = 'Too many requests to the outreach service';
                    errorMessage = 'Please wait a moment before trying again.';
                    return NextResponse.json({ success: false, message, errors: [{ message: errorMessage }] } as OutreachResponse, { status: 429 });
                }
                return NextResponse.json({ success: false, message, errors: [{ message: 'Please check your input and try again.' }] } as OutreachResponse, { status: 400 });
            }

            console.error('API /api/v1/workflows/submit non-Axios error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return NextResponse.json({
                success: false,
                message: errorMessage,
                errors: [{ message: errorMessage }]
            } as OutreachResponse, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('API /api/contacts/outreach top-level error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the request.';
        return NextResponse.json({
            success: false,
            message: errorMessage,
            errors: [{ message: errorMessage }]
        } as OutreachResponse, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const setTokenLimitSchema = z.object({
    target_user_id: z.string().uuid('Invalid user ID'),
    token_limit: z.number().int().min(0, 'Token limit must be 0 or greater')
});

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await req.json();
        const validationResult = setTokenLimitSchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }
        
        const { target_user_id, token_limit } = validationResult.data;

        // Get user's organization to get org_id
        const { data: orgData, error: orgError } = await supabase.rpc('get_user_organization', {
            current_user_id: user.id
        });

        if (orgError || !orgData || orgData.length === 0) {
            return NextResponse.json(
                { error: 'User is not part of any organization' },
                { status: 400 }
            );
        }

        const organizationId = orgData[0].id;

        // Call the set_user_token_limit RPC function
        const { data: result, error: rpcError } = await supabase.rpc('set_user_token_limit', {
            org_id: organizationId,
            target_user_id: target_user_id,
            new_limit: token_limit,
            set_by: user.id
        });

        if (rpcError) {
            console.error('RPC error:', rpcError);
            return NextResponse.json(
                { error: 'Failed to set token limit' },
                { status: 500 }
            );
        }

        // Check if the RPC function returned an error
        if (result && !result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: 'Token limit set successfully',
            old_limit: result.old_limit,
            new_limit: result.new_limit
        });

    } catch (error: unknown) {
        console.error('API /api/organization/tokens POST error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import type { OrganizationData } from '@/types/organization';

const createOrganizationSchema = z.object({
    name: z.string()
        .min(1, 'Organization name is required')
        .max(100, 'Organization name must be less than 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Organization name contains invalid characters')
        .transform(str => str.trim())
});

export async function GET() {
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

        // Single optimized query to get all organization data
        const { data: orgData, error: orgError } = await supabase.rpc('get_user_organization', {
            current_user_id: user.id
        });

        if (orgError) {
            // User is not part of any organization
            return NextResponse.json({
                organization: null
            });
        }

        if (!orgData || orgData.length === 0) {
            return NextResponse.json({
                organization: null
            });
        }

        const organizationData: OrganizationData = {
            id: orgData[0].id,
            name: orgData[0].name,
            invite_code: orgData[0].invite_code,
            created_by: orgData[0].created_by,
            created_at: orgData[0].created_at,
            total_tokens: orgData[0].total_tokens || 0,
            members: orgData[0].members,
            memberCount: orgData[0].member_count,
            isOwner: orgData[0].is_owner
        };

        return NextResponse.json({
            organization: organizationData
        });

    } catch (error: unknown) {
        console.error('API /api/organization GET error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

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
        const validationResult = createOrganizationSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { name } = validationResult.data;

        // Check if user is already part of an organization
        const { data: existingMembership, error: existingMembershipError } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (existingMembershipError === null && existingMembership) {
            return NextResponse.json(
                { error: 'User is already part of an organization' },
                { status: 400 }
            );
        }

        // Generate unique invite code
        const inviteCode = nanoid(12);

        // Create organization

        const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: name,
                invite_code: inviteCode,
                created_by: user.id
            })
            .select()
            .single();


        if (orgError) {
            throw new Error(`Failed to create organization: ${orgError.message}`);
        }

        // Add creator as first member
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: organization.id,
                user_id: user.id
            });

        if (memberError) {
            throw new Error(`Failed to add creator as member: ${memberError.message}`);
        }

        // Connect user's existing companies to organization
        const { error: rpcError } = await supabase.rpc('update_user_companies_organization', {
            target_user_id: user.id,
            target_organization_id: organization.id
        });

        if (rpcError) {
            console.error('Failed to connect companies to organization:', rpcError);
            // Don't throw - organization creation succeeded, this is just data sync
        }

        return NextResponse.json({
            message: 'Organization created successfully',
            organization: {
                id: organization.id,
                name: organization.name,
                invite_code: organization.invite_code
            }
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('API /api/organization POST error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
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

        // Get the request body to determine what to update
        const body = await req.json();

        if (body.action !== 'refresh_invite_code') {
            return NextResponse.json(
                { error: 'Invalid action. Only refresh_invite_code is supported.' },
                { status: 400 }
            );
        }

        // Generate new invite code
        const newInviteCode = nanoid(12);

        // Directly update organization owned by user
        const { data: updatedOrg, error: updateError } = await supabase
            .from('organizations')
            .update({ invite_code: newInviteCode })
            .eq('created_by', user.id)
            .select('invite_code')
            .single();

        if (updateError || !updatedOrg) {
            return NextResponse.json(
                { error: 'You are not an organization owner or no organization found' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            message: 'Invite code refreshed successfully',
            invite_code: updatedOrg.invite_code
        });

    } catch (error: unknown) {
        console.error('API /api/organization PATCH error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

const joinOrganizationSchema = z.object({
  invite_code: z.string()
    .length(12, 'Invite code must be exactly 12 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid invite code format')
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

    // Apply organization join rate limiting
    const rateLimit = await rateLimiters.joinOrgPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many organization join attempts. Please wait before trying again.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = joinOrganizationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { invite_code } = validationResult.data;

    // Check if user is already part of an organization
    const { data: existingMembership, error: existingMembershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingMembershipError === null && existingMembership) {
      return NextResponse.json(
        { error: 'User is already part of an organization. Leave your current organization first.' },
        { status: 400 }
      );
    }

    // Find organization by invite code
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, invite_code')
      .eq('invite_code', invite_code)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id
      });

    if (memberError) {
      throw new Error(`Failed to join organization: ${memberError.message}`);
    }

    // Connect user's existing companies to organization
    const { error: rpcError } = await supabase.rpc('update_user_companies_organization', {
      target_user_id: user.id,
      target_organization_id: organization.id
    });

    if (rpcError) {
      console.error('Failed to connect companies to organization:', rpcError);
    }

    return NextResponse.json({
      message: 'Successfully joined organization',
      organization: {
        id: organization.id,
        name: organization.name
      }
    });

  } catch (error: unknown) {
    console.error('API /api/organization/join POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
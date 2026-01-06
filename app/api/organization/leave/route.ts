import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

interface OrganizationResponse {
  id: string;
  name: string;
  created_by: string;
}

interface MembershipWithOrganization {
  id: string;
  organization_id: string;
  organizations: OrganizationResponse;
}

export async function DELETE() {
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

    // Apply organization operations rate limiting
    const rateLimit = await rateLimiters.organizationPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Organization operations rate limit exceeded. Please wait before trying again.'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Check if user is part of an organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        id,
        organization_id,
        organizations!inner (
          id,
          name,
          created_by
        )
      `)
      .eq('user_id', user.id)
      .single() as { data: MembershipWithOrganization | null, error: unknown };

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User is not part of any organization' },
        { status: 400 }
      );
    }

    const organization = membership.organizations;

    // Check if user is the owner
    if (organization.created_by === user.id) {
      // Get all members count
      const { count: memberCount, error: countError } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      if (countError) {
        throw new Error(`Failed to check member count: ${countError.message}`);
      }

      if (memberCount && memberCount > 1) {
        return NextResponse.json(
          { error: 'Owner cannot leave the organization because the organization still has connected members.' },
          { status: 400 }
        );
      }

      // Get organization details including token balance
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('total_tokens')
        .eq('id', organization.id)
        .single();

      if (orgError) {
        throw new Error(`Failed to get organization details: ${orgError.message}`);
      }

      // Check if organization has token balance
      if (orgData.total_tokens > 0) {
        return NextResponse.json(
          { error: `Cannot leave organization with remaining token balance of ${orgData.total_tokens.toLocaleString()}. Please contact support for assistance.` },
          { status: 400 }
        );
      }

      // Use RPC function to handle both operations atomically in a transaction
      const { error: deleteOrgWithCleanupError } = await supabase.rpc('delete_organization_with_cleanup', {
        org_id: organization.id,
        owner_user_id: user.id
      });

      if (deleteOrgWithCleanupError) {
        if (deleteOrgWithCleanupError.message.includes('token_history_organization_id_fkey')) {
          throw new Error('Cannot delete organization because there is associated history. Please contact support for assistance.');
        }
        throw new Error(`Failed to delete organization: ${deleteOrgWithCleanupError.message}`);
      }

      return NextResponse.json({
        message: 'Organization deleted successfully (you were the only member)'
      });
    } else {
      // Remove user from organization members
      const { error: removeError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', membership.id);

      if (removeError) {
        throw new Error(`Failed to leave organization: ${removeError.message}`);
      }

      // Disconnect user's companies from organization
      const { error: rpcError } = await supabase.rpc('update_user_companies_organization', {
        target_user_id: user.id,
        target_organization_id: null
      });

      if (rpcError) {
        console.error('Failed to disconnect companies from organization:', rpcError);
      }

      return NextResponse.json({
        message: 'Successfully left organization'
      });
    }

  } catch (error: unknown) {
    console.error('API /api/organization/leave DELETE error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
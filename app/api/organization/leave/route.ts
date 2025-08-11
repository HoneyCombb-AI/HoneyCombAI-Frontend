import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
          { error: 'Cannot leave organization as owner with other members. Remove all members first or transfer ownership.' },
          { status: 400 }
        );
      }

      // Use RPC function to handle both operations atomically in a transaction
      const { error: deleteOrgWithCleanupError } = await supabase.rpc('delete_organization_with_cleanup', {
        org_id: organization.id,
        owner_user_id: user.id
      });

      if (deleteOrgWithCleanupError) {
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
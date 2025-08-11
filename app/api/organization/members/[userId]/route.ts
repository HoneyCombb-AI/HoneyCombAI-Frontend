import { NextRequest, NextResponse } from 'next/server';
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is owner of an organization
    const { data: currentUserMembership, error: currentUserError } = await supabase
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

    if (currentUserError || !currentUserMembership) {
      return NextResponse.json(
        { error: 'User is not part of any organization' },
        { status: 400 }
      );
    }

    const organization = currentUserMembership.organizations;

    // Check if current user is the owner
    if (organization.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only organization owner can remove members' },
        { status: 403 }
      );
    }

    // Prevent owner from removing themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself as owner. Use leave organization instead.' },
        { status: 400 }
      );
    }

    // Check if the target user is a member of the same organization
    const { data: targetMembership, error: targetError } = await supabase
      .from('organization_members')
      .select('id, user_id')
      .eq('user_id', userId)
      .eq('organization_id', organization.id)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this organization' },
        { status: 404 }
      );
    }

    // Remove the member
    const { error: removeError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', targetMembership.id);

    if (removeError) {
      throw new Error(`Failed to remove member: ${removeError.message}`);
    }

    // Disconnect removed user's companies from organization
    const { error: rpcError } = await supabase.rpc('update_user_companies_organization', {
      target_user_id: userId,
      target_organization_id: null
    });

    if (rpcError) {
      console.error('Failed to disconnect companies from organization:', rpcError);
    }

    return NextResponse.json({
      message: 'Member removed successfully'
    });

  } catch (error: unknown) {
    console.error('API /api/organization/members/[userId] DELETE error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
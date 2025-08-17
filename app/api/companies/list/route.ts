import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CompanyListItem {
  id: string;
  name: string;
}

interface CompanyListResponse {
  companies: CompanyListItem[];
}

interface OrganizationMember {
  organization_id: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch companies for the current user with proper security
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name')
      .or(
        `user_id.eq.${await supabase.auth.getUser().then(u => u.data.user?.id)},` +
        `organization_id.in.(${await getOrganizationIds(supabase)})`
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    const response: CompanyListResponse = {
      companies: companies || []
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('API /api/companies/list error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to get organization IDs for the current user
async function getOrganizationIds(supabase: SupabaseClient): Promise<string> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return '';

    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.user.id);

    if (!orgMembers || orgMembers.length === 0) return '';

    return orgMembers.map((member: OrganizationMember) => member.organization_id).join(',');
  } catch (error) {
    console.error('Error getting organization IDs:', error);
    return '';
  }
}
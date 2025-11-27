import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

export interface GrowthEngineContact {
  contact_id: string;
  company_id: string | null;
  linkedin_urn: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  headline: string | null;
  about: string | null;
  profile_url: string | null;
  profile_picture_url: string | null;
  background_picture_url: string | null;
  country: string | null;
  city: string | null;
  location_full: string | null;
  country_code: string | null;
  follower_count: number | null;
  connection_count: number | null;
  current_company: string | null;
  current_company_url: string | null;
  created_timestamp: number | null;
  is_creator: boolean | null;
  is_influencer: boolean | null;
  is_premium: boolean | null;
  open_to_work: boolean | null;
  show_follower_count: boolean | null;
  email: string | null;
  languages: string[] | null;
}

export interface GrowthEngineContactsResponse {
  contacts: GrowthEngineContact[];
}

export async function GET(): Promise<
  NextResponse<GrowthEngineContactsResponse | { error: string }>
> {
  try {
    const { rows } = await sql<GrowthEngineContact>({
      text: `
        SELECT
          contact_id,
          company_id,
          linkedin_urn,
          first_name,
          last_name,
          full_name,
          headline,
          about,
          profile_url,
          profile_picture_url,
          background_picture_url,
          country,
          city,
          location_full,
          country_code,
          follower_count,
          connection_count,
          current_company,
          current_company_url,
          created_timestamp::DOUBLE PRECISION AS created_timestamp,
          is_creator,
          is_influencer,
          is_premium,
          open_to_work,
          show_follower_count,
          email,
          languages
        FROM contacts
      `
    });

    return NextResponse.json<GrowthEngineContactsResponse | { error: string }>({
      contacts: rows
    });
  } catch (error) {
    console.error('Error fetching growth engine contacts:', error);
    return NextResponse.json<GrowthEngineContactsResponse | { error: string }>(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

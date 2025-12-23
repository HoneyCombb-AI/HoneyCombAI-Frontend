import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createDataClient } from '@/lib/supabase/data-server';
import { rateLimiters } from '@/app/api/utils/rate-limiter';

/**
 * GET /api/contacts/[id] - Fetch detailed contact data for drawer
 * 
 * This endpoint loads comprehensive contact data for detailed view:
 * - Complete contact details with social handles
 * - All signals with descriptions and sources
 * - Contact nudges
 * - Topics of interest
 * - AI analysis results
 * - Social activity metrics
 *
 * Additionally, we fetch the raw `contacts` table row as `full_details` so the
 * UI can display *all* columns from the new Supabase schema in a dedicated
 * “Full details” section (without bloating list RPC responses).
 */

// Detailed interfaces for drawer data
export interface DrawerContactSignal {
  id: string;
  signal_type: string;
  confidence_score: number;
  description: string | null;
  source: string | null;
  source_date: string | null;
  created_at: string;
  is_custom: boolean;
}

export interface DrawerContactNudge {
  id: string;
  nudges: string[] | null;
  created_at: string;
}

export interface DrawerAIAnalysis {
  id: string;
  account_overview: { summary: string; key_details: string[] } | null;
  contact_insights: { summary: string; detailed_insights: string[] } | null;
  why_reach_out: Record<string, string | string[]> | null;
  final_assessment: string | null;
  strategic_recommendations: string[] | null;
  confidence_score: number | null;
  confidence_reasoning: string | null;
  created_at: string;
}

export interface DrawerSocialActivity {
  activity_level: string;
  activity_score: number;
  engagement_score: number;
  most_used_platform_by_time: string | null;
  most_engaged_platform: string | null;
  instagram_time_minutes: number;
  linkedin_time_minutes: number;
  twitter_time_minutes: number;
  instagram_engagement_score: number;
  linkedin_engagement_score: number;
  twitter_engagement_score: number;
  instagram_posts_per_day: number;
  linkedin_posts_per_day: number;
  twitter_posts_per_day: number;
  instagram_best_time: string | null;
  linkedin_best_time: string | null;
  twitter_best_time: string | null;
  updated_at: string;
}

export interface DrawerContact {
  id: string;
  full_name: string;
  title: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  profile_picture: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  languages: string[] | null;
  updated_at: string;
  istracked: boolean;
  primary_analysis_completed: boolean;
  primary_analysis_requested: boolean;
  temperature: 'hot' | 'warm' | 'cold' | null;
  signals: DrawerContactSignal[];
  nudges: DrawerContactNudge[];
  topics: string[];
  ai_analysis: DrawerAIAnalysis[];
  social_activity: DrawerSocialActivity | null;
}

/**
 * Full `contacts` row from the new Supabase schema.
 * NOTE: Keep this strictly typed (no `any`) and aligned with the DB columns.
 * We intentionally model JSONB as `unknown | null` to avoid unsafe assumptions.
 */
export interface ContactFullDetails {
  id: string;
  company_id: string | null;
  full_name: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  in_crm: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  profile_picture_url: string | null;
  instagram_handle: string | null;
  country: string | null;
  languages: string[] | null;
  user_id: string | null;
  primary_analysis_completed: boolean | null;
  primary_analysis_requested: boolean;
  temperature: 'hot' | 'warm' | 'cold' | null;
  contact_sort_score: number;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  about: string | null;
  background_picture_url: string | null;
  location_full: string | null;
  country_code: string | null;
  follower_count: number | null;
  connection_count: number | null;
  current_company: string | null;
  is_creator: boolean;
  is_influencer: boolean;
  is_premium: boolean;
  open_to_work: boolean;
  show_follower_count: boolean;
}

const CONTACT_FULL_DETAILS_SELECT = [
  // Identifiers and relationships
  'id',
  'company_id',
  'user_id',

  // Core profile fields
  'full_name',
  'first_name',
  'last_name',
  'headline',
  'about',
  'email',
  'phone',

  // Social links/handles
  'linkedin_url',
  'twitter_handle',
  'instagram_handle',

  // Media
  'profile_picture_url',
  'background_picture_url',

  // Location/language
  'city',
  'country',
  'country_code',
  'location_full',
  'languages',

  // CRM flags and scoring
  'in_crm',
  'contact_sort_score',

  // Analysis flags and derived status
  'primary_analysis_completed',
  'primary_analysis_requested',
  'temperature',

  // Audience metrics
  'follower_count',
  'connection_count',
  'current_company',
  'is_creator',
  'is_influencer',
  'is_premium',
  'open_to_work',
  'show_follower_count',

  // Timestamps
  'created_at',
  'updated_at',
].join(',');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params;

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Auth client (old Supabase): used only to validate user + rate-limit.
    const authSupabase = await createAuthClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply detailed view rate limiting
    const rateLimit = await rateLimiters.detailViewPerUser(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Detail view rate limit exceeded. Please wait before making more requests.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '300',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }

    // Use optimized single RPC function for maximum performance
    // Data client (new Supabase): used to fetch contact data.
    const dataSupabase = createDataClient();

    const { data: contacts, error } = await dataSupabase.rpc('get_contact_details', {
      input_user_email: user.email ?? null,
      input_contact_id: contactId
    });

    if (error) {
      throw new Error(`Failed to fetch contact details: ${error.message}`);
    }

    const contact = contacts?.[0] || null;

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Data is already properly formatted as JSONB from the database
    const formattedContact: DrawerContact = {
      ...contact,
      signals: contact.signals || [],
      nudges: contact.nudges || [],
      topics: contact.topics || [],
      ai_analysis: contact.ai_analysis || [],
      social_activity: contact.social_activity || null
    };

    /**
     * Fetch raw contact row for “Full details”.
     *
     * Important:
     * - We do NOT filter by user_id (RLS handles scoping).
     * - We use an explicit select list for stability and strict typing.
     */
    const { data: fullDetails, error: fullDetailsError } = await dataSupabase
      .from('contacts')
      .select(CONTACT_FULL_DETAILS_SELECT)
      .eq('id', contactId)
      .single<ContactFullDetails>();

    if (fullDetailsError) {
      throw new Error(`Failed to fetch contact full_details: ${fullDetailsError.message}`);
    }

    return NextResponse.json({ contact: formattedContact, full_details: fullDetails });

  } catch (error: unknown) {
    console.error('API /api/contacts/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
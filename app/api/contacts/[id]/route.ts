import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
 */

// Detailed interfaces for drawer data
export interface DrawerContactSignal {
  id: string;
  signal_type: string;
  confidence_score: number;
  description: string | null;
  source: string | null;
  created_at: string;
}

export interface DrawerContactNudge {
  id: string;
  nudges: string[] | null;
  created_at: string;
}

export interface DrawerAIAnalysis {
  id: string;
  primary_data_analysis: string[] | null;
  detective_reasoning: string[] | null;
  investigation_decision: string[] | null;
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
  signals: DrawerContactSignal[];
  nudges: DrawerContactNudge[];
  topics: string[];
  ai_analysis: DrawerAIAnalysis[];
  social_activity: DrawerSocialActivity | null;
}
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

    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { data: contacts, error } = await supabase.rpc('get_contact_details', {
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

    // Data is already properly formatted from the SQL query
    const formattedContact: DrawerContact = {
      ...contact,
      signals: contact.signals || [],
      nudges: contact.nudges || [],
      topics: contact.topics || [],
      ai_analysis: contact.ai_analysis || [],
      social_activity: contact.social_activity || null
    };

    return NextResponse.json({ contact: formattedContact });

  } catch (error: unknown) {
    console.error('API /api/contacts/[id] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
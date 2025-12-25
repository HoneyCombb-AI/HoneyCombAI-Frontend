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
  source_date: string | null;
  created_at: string;
  is_custom: boolean;
}



export interface DrawerAIAnalysis {
  id: string;
  created_at: string;
  confidence_score: number | null;
  confidence_reasoning: string | null;

  // Account Overview
  role: string | null;
  recent_developments: string[] | string | null; // Can be stringified JSON
  strategic_priorities: string[] | string | null; // Can be stringified JSON
  network: string | null;

  // Contact Insights
  contact_insights_summary: string | null;
  professional_interests: string | null;
  communication_style: string | null;
  decision_indicators: string | null;
  motivations_triggers: string | null;
  influence_level: string | null;

  // Why Reach Out
  buying_signals: string | null;
  engagement_hooks: string | null;
  timing_relevance: string | null;
  account_relevance: string | null;
  current_priorities: string | null;
  explicit_pain_points: string | null;

  // Legacy fields (kept optional to avoid breaking if referenced elsewhere strictly, though we should remove use)
  messaging_tone?: string | null;
  themes_to_use?: string | null;
}

export interface DrawerSocialActivity {
  activity_level: string;
  engagement_style: string;
  consistency: string;
  trend_direction: string;
  trend_change_percent: number;
  primary_active_days: string[] | string; // Handle potential JSON parsing differences
  best_time_window_utc: string;
  total_actions: number;
  avg_weekly_actions: number;
  outward_inward_ratio: number;
  weekend_activity_ratio: number;
  consistency_score: number;
  heatmap: Record<string, Record<string, number>>;
  forecasted_at: string;
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

  primary_analysis_completed: boolean;
  primary_analysis_requested: boolean;
  temperature: 'hot' | 'warm' | 'cold' | null;
  signals: DrawerContactSignal[];

  ai_analysis: DrawerAIAnalysis[];
  social_activity: DrawerSocialActivity | null;
}
export async function GET(
  _req: NextRequest,
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

    // Data is already properly formatted as JSONB from the database
    const formattedContact: DrawerContact = {
      ...contact,
      signals: contact.signals || [],

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
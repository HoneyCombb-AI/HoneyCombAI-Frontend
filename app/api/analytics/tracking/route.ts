import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface FormattedTrackingEvent {
    event_id: string;
    event_type: string;
    ip_address: string;
    clicked_url: string | null;
    location: string | null;
    created_at: string;
    subject: string;
    sent_at: string | null;
    direction: string | null;
    status: string | null;
    contact_id: string;
    contact_name: string;
    contact_email: string;
    contact_linkedin: string | null;
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '200'); // Higher limit so grouping works well
        const eventType = searchParams.get('type') || 'all';
        const searchTerm = searchParams.get('search') || '';
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: events, error: rpcError } = await supabase.rpc('search_email_analytics', {
            search_term: searchTerm,
            page_offset: offset,
            page_limit: limit,
            filter_type: eventType
        });

        if (rpcError) {
            console.error('Failed to load tracking events via RPC:', rpcError);
            return NextResponse.json({ error: `Failed to load tracking events: ${rpcError.message}` }, { status: 500 });
        }

        const rawEvents = events || [];

        // Geolocation processing
        // Extract unique IPs
        const uniqueIps = Array.from(new Set(rawEvents.map((e: any) => e.ip_address).filter(Boolean)));

        // Fetch locations for unique IPs (free, no-auth geojs API, fast enough for ~50 unique IPs)
        const locationMap: Record<string, string> = {};

        await Promise.all(uniqueIps.map(async (ip) => {
            try {
                // Ignore localhost/private IPs mapping
                if (ip === '127.0.0.1' || ip === '::1') {
                    locationMap[ip as string] = 'Localhost';
                    return;
                }
                const res = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, { signal: AbortSignal.timeout(3000) });
                if (res.ok) {
                    const data = await res.json();
                    // Example format: "Portland, Oregon, United States"
                    const parts = [data.city, data.region, data.country].filter(Boolean);
                    if (parts.length > 0) {
                        locationMap[ip as string] = parts.join(', ');
                    }
                }
            } catch (err) {
                console.warn(`Failed to resolve IP location for ${ip}`, err);
            }
        }));

        // Attach location and clicked_url to flattened output
        const formattedEvents: FormattedTrackingEvent[] = rawEvents.map((event: any) => ({
            ...event,
            location: locationMap[event.ip_address] || null,
        }));

        return NextResponse.json({ events: formattedEvents });

    } catch (error: any) {
        console.error('API /api/analytics/tracking error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

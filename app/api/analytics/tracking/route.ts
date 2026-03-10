import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface PaginatedTrackingGroup {
    contact_id: string;
    contact_name: string;
    contact_email: string;
    contact_linkedin: string | null;
    subject: string;
    sent_at: string | null;
    total_activity: number;
    latest_activity: string;
    raw_events: {
        event_id: string;
        event_type: string;
        ip_address: string;
        clicked_url: string | null;
        created_at: string;
        location?: string | null;
    }[];
}

let locationCache = new Map<string, string>(); // In-memory cache

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const page = parseInt(searchParams.get('page') || '1');
        const searchTerm = searchParams.get('search') || '';

        const offset = (page - 1) * limit;

        const { data: groupedEvents, error: rpcError } = await supabase.rpc('get_paginated_email_analytics', {
            search_term: searchTerm,
            page_offset: offset,
            page_limit: limit
        });

        if (rpcError) {
            console.error('Failed to load paginated tracking events via RPC:', rpcError);
            return NextResponse.json({ error: `Failed to load tracking events: ${rpcError.message}` }, { status: 500 });
        }

        const rawGroups = groupedEvents || [];
        const totalCount = rawGroups.length > 0 ? Number(rawGroups[0].total_count) : 0;
        const allIps = rawGroups.flatMap((group: any) =>
            (group.raw_events || []).map((e: any) => e.ip_address)
        ).filter(Boolean);

        const uniqueIps = Array.from(new Set(allIps)) as string[];
        const locationMap: Record<string, string> = {};

        const missingIps = uniqueIps.filter(ip => !locationCache.has(ip) && ip !== '127.0.0.1' && ip !== '::1');
        if (uniqueIps.includes('127.0.0.1')) locationMap['127.0.0.1'] = 'Localhost';
        if (uniqueIps.includes('::1')) locationMap['::1'] = 'Localhost';
        if (missingIps.length > 0) {
            try {
                const chunks = [];
                for (let i = 0; i < missingIps.length; i += 100) {
                    chunks.push(missingIps.slice(i, i + 100));
                }
                for (const chunk of chunks) {
                    const res = await fetch('http://ip-api.com/batch', {
                        method: 'POST',
                        body: JSON.stringify(chunk),
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(3000)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        data.forEach((location: any) => {
                            if (location.status === 'success') {
                                const parts = [location.city, location.regionName, location.country].filter(Boolean);
                                if (parts.length > 0) {
                                    locationCache.set(location.query, parts.join(', '));
                                }
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn(`Failed to resolve bulk IP locations from external service`);
            }
        }
        uniqueIps.forEach(ip => {
            if (locationCache.has(ip)) {
                locationMap[ip] = locationCache.get(ip)!;
            }
        });

        // Attach location to the inner raw_events
        const formattedGroups: PaginatedTrackingGroup[] = rawGroups.map((group: any) => ({
            contact_id: group.contact_id,
            contact_name: group.contact_name,
            contact_email: group.contact_email,
            contact_linkedin: group.contact_linkedin,
            subject: group.subject,
            sent_at: group.sent_at,
            total_activity: group.total_activity,
            latest_activity: group.latest_activity,
            raw_events: (group.raw_events || []).map((event: any) => ({
                ...event,
                location: locationMap[event.ip_address] || null,
            }))
        }));

        return NextResponse.json({
            data: formattedGroups,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: offset + limit < totalCount,
                hasPrev: page > 1
            }
        });

    } catch (error: any) {
        console.error('API /api/analytics/tracking error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}

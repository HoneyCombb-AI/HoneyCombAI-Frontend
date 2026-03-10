import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import type { PaginatedTrackingGroup } from '@/types/analytics';

const locationCache = new Map<string, string>(); // In-memory cache

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const rawLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
        const rawPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
        const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
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

        // Extract org-level excluded locations from the RPC response (same value on every row)
        const excludedLocations: string[] = rawGroups.length > 0
            ? (rawGroups[0].excluded_locations || [])
            : [];

        // Collect all unique IPs for batch geo-resolution
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

        // Build formatted groups with geo filtering applied
        const formattedGroups: PaginatedTrackingGroup[] = rawGroups
            .map((group: any) => {
                const allEvents: any[] = group.raw_events || [];

                // Attach resolved location to each event
                const eventsWithLocation = allEvents.map((event: any) => ({
                    ...event,
                    location: locationMap[event.ip_address] || null,
                }));

                // Filter out events whose resolved location matches an excluded location
                const filteredEvents = eventsWithLocation.filter((event: any) => {
                    const resolvedLocation = event.location;
                    if (!resolvedLocation || excludedLocations.length === 0) return true;
                    return !excludedLocations.some(
                        (excluded: string) =>
                            resolvedLocation.toLowerCase() === excluded.toLowerCase()
                    );
                });

                // Recalculate latest_activity from filtered events only
                const latestActivity = filteredEvents.length > 0
                    ? filteredEvents.reduce((max: string, e: any) =>
                        new Date(e.created_at) > new Date(max) ? e.created_at : max,
                        filteredEvents[0].created_at
                    )
                    : group.latest_activity;

                return {
                    contact_id: group.contact_id,
                    contact_name: group.contact_name,
                    contact_email: group.contact_email,
                    contact_linkedin: group.contact_linkedin,
                    subject: group.subject,
                    sent_at: group.sent_at,
                    total_activity: filteredEvents.length,
                    latest_activity: latestActivity,
                    raw_events: filteredEvents,
                };
            })
            // Remove groups where all events were from excluded locations
            .filter((group: PaginatedTrackingGroup) => group.raw_events.length > 0)
            // Re-sort by filtered total_activity since DB sort was pre-filtering
            .sort((a: PaginatedTrackingGroup, b: PaginatedTrackingGroup) => {
                if (b.total_activity !== a.total_activity) {
                    return (b.total_activity as number) - (a.total_activity as number);
                }
                return new Date(b.latest_activity).getTime() - new Date(a.latest_activity).getTime();
            });

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

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Eye, MousePointerClick, MapPin, Globe, LinkedinIcon, CalendarClock, Mail } from "lucide-react";
import { FormattedTrackingEvent } from "@/app/api/analytics/tracking/route";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";

export default function EmailAnalyticsPage() {
    const [events, setEvents] = useState<FormattedTrackingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await axios.get<{ events: FormattedTrackingEvent[] }>('/api/analytics/tracking', {
                    params: { limit: 200 } // Fetch a large batch to group all activity
                });
                setEvents(response.data.events || []);
                setError(null);
            } catch (err: any) {
                console.error("Error fetching tracking events:", err);
                setError(err.response?.data?.error || err.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Fast client-side filtering by name, email, or subject
    const filteredEvents = events.filter((e) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            e.contact_name.toLowerCase().includes(term) ||
            e.contact_email.toLowerCase().includes(term) ||
            e.subject.toLowerCase().includes(term)
        );
    });

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex-1 flex flex-col h-full min-h-0">
            {/* Header/Filter Bar matching EmailFilters style */}
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-b bg-white shrink-0 z-10 sticky top-0">
                {/* Search Bar */}
                <div className="relative w-full sm:w-[320px] shrink-0">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search across all activity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white w-full h-9"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-gray-400 flex-1">
                    <Loading />
                    <p className="mt-4">Loading global interaction data...</p>
                </div>
            ) : error ? (
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                    <div className="space-y-6 max-w-5xl mx-auto w-full">
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center">
                            {error}
                        </div>
                    </div>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                    <div className="space-y-6 max-w-5xl mx-auto w-full">
                        <div className="flex flex-col items-center justify-center p-24 text-gray-400 bg-white border border-dashed rounded-xl">
                            <Globe className="w-12 h-12 mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-900">No activity found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                    <div className="space-y-6 max-w-5xl mx-auto w-full">
                        <div className="space-y-4">
                            {(() => {
                                // First, group by Contact
                                const contactsMap = new Map<string, typeof filteredEvents>();

                                filteredEvents.forEach(event => {
                                    if (!contactsMap.has(event.contact_id)) {
                                        contactsMap.set(event.contact_id, []);
                                    }
                                    contactsMap.get(event.contact_id)!.push(event);
                                });

                                // Convert to array and sort by latest event overall
                                const groupedContacts = Array.from(contactsMap.entries()).map(([contact_id, contactEvents]) => {
                                    const latestEvent = contactEvents.reduce((latest, current) =>
                                        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                                    );

                                    return {
                                        contact_id,
                                        contact_name: contactEvents[0].contact_name,
                                        contact_email: contactEvents[0].contact_email,
                                        contact_linkedin: contactEvents[0].contact_linkedin,
                                        events: contactEvents,
                                        latest_activity: latestEvent.created_at
                                    };
                                }).sort((a, b) => new Date(b.latest_activity).getTime() - new Date(a.latest_activity).getTime());

                                return groupedContacts.map((contactGroup) => {
                                    // Group inside the contact by Subject
                                    const subjectsMap = new Map<string, typeof filteredEvents>();
                                    contactGroup.events.forEach(event => {
                                        if (!subjectsMap.has(event.subject)) {
                                            subjectsMap.set(event.subject, []);
                                        }
                                        subjectsMap.get(event.subject)!.push(event);
                                    });

                                    return (
                                        <Card key={contactGroup.contact_id} className="overflow-hidden flex flex-col shadow-xs border border-gray-200">
                                            {/* Contact Header */}
                                            <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-100 to-indigo-200 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-sm">
                                                    {getInitials(contactGroup.contact_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {contactGroup.contact_name}
                                                        </h4>
                                                        {contactGroup.contact_linkedin && (
                                                            <a href={contactGroup.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:opacity-80">
                                                                <LinkedinIcon className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {contactGroup.contact_email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Subjects inside contact */}
                                            <div className="divide-y divide-gray-100/50">
                                                {Array.from(subjectsMap.entries()).map(([subject, subjectEvents]) => {
                                                    // Aggregate identical actions (type + IP + url)
                                                    const actionMap = new Map<string, {
                                                        count: number;
                                                        type: string;
                                                        location: string | null;
                                                        ip: string;
                                                        url: string | null;
                                                        last_time: string;
                                                        sent_at: string | null;
                                                    }>();

                                                    subjectEvents.forEach(e => {
                                                        const key = `${e.event_type}-${e.ip_address}-${e.clicked_url || ''}`;
                                                        if (!actionMap.has(key)) {
                                                            actionMap.set(key, {
                                                                count: 0,
                                                                type: e.event_type,
                                                                location: e.location,
                                                                ip: e.ip_address,
                                                                url: e.clicked_url,
                                                                last_time: e.created_at,
                                                                sent_at: e.sent_at
                                                            });
                                                        }
                                                        const agg = actionMap.get(key)!;
                                                        agg.count += 1;
                                                        if (new Date(e.created_at) > new Date(agg.last_time)) {
                                                            agg.last_time = e.created_at;
                                                        }
                                                    });

                                                    const aggregatedActions = Array.from(actionMap.values())
                                                        .sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());

                                                    const sentAtStr = aggregatedActions[0]?.sent_at;

                                                    return (
                                                        <div key={subject} className="px-5 py-4">
                                                            {/* Subject Header */}
                                                            <div className="mb-4 text-center md:text-left">
                                                                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                                                                    {subject}
                                                                </p>
                                                                {sentAtStr && (
                                                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                                                        Originally sent on {format(parseISO(sentAtStr), "MMM d, yyyy 'at' h:mm a")}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Tracking Details List */}
                                                            <div className="space-y-2 border-none md:border-l-2 md:border-gray-100 md:ml-2 md:pl-4">
                                                                {aggregatedActions.map((action, idx) => {
                                                                    const isOpen = action.type === 'open';
                                                                    return (
                                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs text-sm hover:border-gray-300 transition-colors">
                                                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
                                                                                <div className="flex-1 space-y-1.5 w-full">
                                                                                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                                                                                        {isOpen ? (
                                                                                            <span className="flex items-center gap-1.5 font-medium text-green-700 w-fit">
                                                                                                <Eye className="w-4 h-4" /> Opened {action.count}x
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="flex items-center gap-1.5 font-medium text-blue-700 w-fit">
                                                                                                <MousePointerClick className="w-4 h-4" /> Clicked {action.count}x
                                                                                            </span>
                                                                                        )}

                                                                                        <span className="text-gray-500 flex items-center gap-1 md:ml-2">
                                                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                                                            <span className="truncate max-w-[200px]" title={action.location || 'Unknown Location'}>
                                                                                                {action.location || 'Unknown Location'}
                                                                                            </span>
                                                                                        </span>
                                                                                    </div>

                                                                                    {!isOpen && action.url && (
                                                                                        <a href={action.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-xs truncate max-w-[400px]" title={action.url}>
                                                                                            {action.url}
                                                                                        </a>
                                                                                    )}

                                                                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                                                                                            {format(parseISO(action.last_time), "MMM d 'at' h:mm a")}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Globe className="w-3.5 h-3.5 shrink-0" />
                                                                                            {action.ip || "Unknown IP"}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

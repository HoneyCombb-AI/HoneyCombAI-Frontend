"use client";

import { Eye, MousePointerClick, MapPin, Globe, CalendarClock, Mail, Share2 } from "lucide-react";
import { Linkedin } from "lucide-react";
import { StepMetric, StepContact } from "@/types/analytics";
import { Loading } from "@/components/loading";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { format, parseISO } from "date-fns";

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ActivityFeedDetailsProps {
    stepMetrics: StepMetric[];
    selectedStep: number | null;
    stepContacts: StepContact[];
    loadingContacts: boolean;
    contactPagination: PaginationInfo | null;
    expandedContact: string | null;
    onExpandedChange: (contactId: string | null) => void;
}

/** Extracts the country portion from a location string like "Madrid, Madrid, Spain" → "Spain" */
function parseCountry(location: string | null | undefined): string | null {
    if (!location) return null;
    const parts = location.split(',');
    return parts[parts.length - 1].trim();
}

/** Returns true if the contact's events span 3+ distinct countries, suggesting internal forwarding */
function isPossiblyForwarded(rawEvents: StepContact['raw_events']): boolean {
    if (!rawEvents) return false;
    const countries = new Set<string>();
    for (const group of rawEvents) {
        for (const event of group.events ?? []) {
            const country = parseCountry(event.location);
            if (country) countries.add(country);
        }
    }
    return countries.size >= 3;
}

export function ActivityFeedDetails({
    stepMetrics,
    selectedStep,
    stepContacts,
    loadingContacts,
    contactPagination,
    expandedContact,
    onExpandedChange,
}: ActivityFeedDetailsProps) {
    if (!selectedStep) {
        return null;
    }

    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold">
                    {stepMetrics.find(m => m.step === selectedStep)?.step_label}
                </h3>
                <span className="text-sm text-gray-500">
                    ({contactPagination?.total || 0} contacts)
                </span>
            </div>

            {loadingContacts ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                    <Loading />
                    <p className="text-sm text-muted-foreground mt-4">Loading your Activity...</p>
                </div>
            ) : stepContacts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p>No contacts with activity</p>
                </div>
            ) : (
                <Accordion
                    type="single"
                    collapsible
                    value={expandedContact || ""}
                    onValueChange={(val) => {
                        onExpandedChange(val || null);
                    }}
                    className="space-y-2"
                >
                    {stepContacts.map((contact) => (
                        <AccordionItem
                            key={contact.contact_id}
                            value={contact.contact_id}
                            className="border border-gray-200 rounded-lg bg-white last:border-b"
                        >
                            {/* Accordion Trigger Section */}
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50/50 rounded-t-lg">
                                <div className="flex flex-1 w-full items-center justify-between gap-3 min-w-0">
                                    {/* Left Section: Name & Email */}
                                    <div className="flex flex-col items-start w-[35%] max-w-[250px] shrink-0 min-w-0">
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <span className="font-semibold text-gray-900 truncate min-w-0 block">
                                                {contact.contact_name}
                                            </span>
                                            {contact.contact_linkedin && (
                                                <a href={contact.contact_linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#0A66C2] hover:opacity-80 transition-opacity shrink-0">
                                                    <Linkedin className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5 w-full min-w-0">
                                            <Mail className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate min-w-0 block">
                                                {contact.contact_email}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Section: Subject and Date (Flex grow) */}
                                    <div className="flex flex-col justify-center flex-1 min-w-0 px-3 border-l border-gray-100">
                                        <span className="text-sm font-medium text-gray-700 break-words line-clamp-2">
                                            {contact.subject}
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1 truncate w-full block">
                                            Sent: {contact.sent_at ? format(parseISO(contact.sent_at), "do MMMM yyyy, h:mm a") : 'Unknown'}
                                        </span>
                                    </div>

                                    {/* Right Section: Forwarding badge + Stats */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isPossiblyForwarded(contact.raw_events) && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md whitespace-nowrap hidden sm:inline-flex">
                                                <Share2 className="w-3 h-3 shrink-0" />
                                                Internally forwarded
                                            </span>
                                        )}
                                        <div className="flex bg-white border rounded-md shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 border-r border-gray-100 bg-gray-50/50">
                                                <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span className="text-sm font-semibold text-gray-700">{contact.unique_opens}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50/50">
                                                <MousePointerClick className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="text-sm font-semibold text-gray-700">{contact.unique_clicks}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>

                            {/* Accordion Content Section */}
                            <AccordionContent>
                                <div className="px-6 pb-6 pt-4 bg-gray-50/80 border-t border-gray-100">
                                    <h4 className="text-sm font-medium text-gray-700 mb-4 px-1">Engagement Details</h4>
                                    {contact.raw_events && contact.raw_events.length > 0 ? (
                                        <Accordion type="multiple" className="flex flex-col gap-4">
                                            {contact.raw_events.map((group, idx) => {
                                                const isOpen = group.event_type === 'open';
                                                let domain = '';
                                                if (!isOpen && group.clicked_url) {
                                                    try {
                                                        domain = new URL(group.clicked_url).hostname.replace('www.', '');
                                                    } catch (e) { }
                                                }

                                                return (
                                                    <AccordionItem key={idx} value={`group-${idx}`} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md last:border-b">
                                                        {/* Group Header */}
                                                        <AccordionTrigger className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-linear-to-r from-gray-50 to-white hover:no-underline">
                                                            <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row flex-1">
                                                                <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 border border-gray-200'}`}>
                                                                    {isOpen ? (
                                                                        <Eye className="w-4 h-4" />
                                                                    ) : domain ? (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={domain} className="w-4 h-4 rounded-sm" />
                                                                    ) : (
                                                                        <MousePointerClick className="w-4 h-4 text-gray-500" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex flex-col items-start bg-transparent text-left w-full">
                                                                    {!isOpen && group.clicked_url ? (
                                                                        <a href={group.clicked_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-semibold text-[14px] text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-full" title={group.clicked_url}>
                                                                            {group.clicked_url.length > 60 ? `${group.clicked_url.slice(0, 60)}…` : group.clicked_url}
                                                                        </a>
                                                                    ) : (
                                                                        <div className="font-semibold text-gray-900 text-[14px] truncate max-w-full" title="Email Opened">
                                                                            Email Opened
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 flex items-center gap-2">
                                                                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                                                    {group.count} {group.count === 1 ? 'Event' : 'Events'}
                                                                </span>
                                                            </div>
                                                        </AccordionTrigger>

                                                        {/* Group Details (Events) */}
                                                        <AccordionContent className="border-t border-gray-100 px-0 py-0 m-0">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 p-5">
                                                                {group.events?.map((event, eIdx) => (
                                                                    <div key={eIdx} className="flex flex-col gap-2 w-full h-full p-4 border border-gray-300 rounded-lg hover:border-gray-500 transition-colors bg-white/50 backdrop-blur-sm">
                                                                        {/* Location - Primary Focus */}
                                                                        {event.location ? (
                                                                            <div className="flex items-start gap-2.5 text-gray-900">
                                                                                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                                                <span className="font-medium wrap-break-word leading-tight">{event.location}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-start gap-2.5 text-gray-900">
                                                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                                                <span className="font-semibold text-gray-400 wrap-break-word leading-tight">Location Unknown</span>
                                                                            </div>
                                                                        )}

                                                                        {/* Time - Secondary Focus */}
                                                                        <div className="flex items-start gap-2.5 text-gray-800">
                                                                            <CalendarClock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                                                                            <span className="font-normal text-sm leading-tight wrap-break-word">{format(parseISO(event.created_at), "do MMMM yyyy, h:mm a")}</span>
                                                                        </div>

                                                                        {/* IP Address - Muted */}
                                                                        <div className="flex items-center gap-2 text-gray-500 mt-1">
                                                                            <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                            <span className="text-xs font-mono tracking-tight">{event.ip_address || 'Unknown IP'}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    ) : (
                                        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
                                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-3">
                                                <MousePointerClick className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">No detailed events</p>
                                            <p className="text-sm text-gray-500 mt-1">Detailed tracking data is not available for this contact.</p>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}


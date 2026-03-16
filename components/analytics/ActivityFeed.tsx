"use client";

import { Eye, MousePointerClick, MapPin, Globe, CalendarClock, Mail, ChevronDown, Users } from "lucide-react";
import { Linkedin } from "lucide-react";
import { StepMetric, StepContact } from "@/types/analytics";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
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

interface ActivityFeedProps {
    stepMetrics: StepMetric[];
    selectedStep: number | null;
    stepContacts: StepContact[];
    loadingContacts: boolean;
    contactPagination: PaginationInfo | null;
    expandedContact: string | null;
    onStepClick: (step: number) => void;
    onExpandedChange: (contactId: string | null) => void;
}

function getStepBadgeColor(step: number) {
    const colors = [
        "bg-blue-100 text-blue-800",
        "bg-emerald-100 text-emerald-800",
        "bg-amber-100 text-amber-800",
        "bg-purple-100 text-purple-800",
        "bg-rose-100 text-rose-800",
    ];
    return colors[(step - 1) % colors.length];
}

export function ActivityFeed({
    stepMetrics,
    selectedStep,
    stepContacts,
    loadingContacts,
    contactPagination,
    expandedContact,
    onStepClick,
    onExpandedChange,
}: ActivityFeedProps) {

    if (stepMetrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-lg font-medium">No tracking data yet</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Compact Step Metric Row - horizontal chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                {stepMetrics.map((metric) => (
                    <button
                        key={metric.step}
                        onClick={() => onStepClick(metric.step)}
                        className={`
                            flex items-center gap-3 px-4 py-2 rounded-lg border transition-all hover:shadow-sm text-left
                            ${selectedStep === metric.step
                                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
                                : 'bg-white border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <Badge className={getStepBadgeColor(metric.step)}>
                            {metric.step_label}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-sm">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-medium">{metric.total_contacts}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="font-semibold">{metric.unique_opens}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 text-sm">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            <span className="font-semibold">{metric.unique_clicks}</span>
                        </div>
                        {selectedStep === metric.step && (
                            <ChevronDown className="w-4 h-4 text-gray-400 rotate-180" />
                        )}
                    </button>
                ))}
            </div>

            {/* Contacts Accordion */}
            {selectedStep && (
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
                        <div className="flex items-center justify-center py-12">
                            <Loading />
                        </div>
                    ) : stepContacts.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p>No contacts with activity</p>
                        </div>
                    ) : (
                        <>
                            <Accordion
                                type="multiple"
                                value={expandedContact ? [expandedContact] : []}
                                onValueChange={(vals) => {
                                    onExpandedChange(vals[0] || null);
                                }}
                                className="space-y-2"
                            >
                                {stepContacts.map((contact) => (
                                    <AccordionItem
                                        key={contact.contact_id}
                                        value={contact.contact_id}
                                        className="border border-gray-200 rounded-lg bg-white"
                                    >
                                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50/50 rounded-t-lg">
                                            <div className="flex flex-1 items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-[200px] max-w-[400px]">
                                                    <div className="flex flex-col items-start min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900 truncate">{contact.contact_name}</span>
                                                            {contact.contact_linkedin && (
                                                                <a href={contact.contact_linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#0A66C2] hover:opacity-80 transition-opacity">
                                                                    <Linkedin className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            <span className="truncate">{contact.contact_email}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Middle Section: Subject and Date (Flex grow to take space) */}
                                                <div className="hidden md:flex flex-col items-start flex-1 min-w-0 pr-4 border-l pl-4 border-gray-100">
                                                    <span className="text-sm font-medium text-gray-700 truncate w-full" title={contact.subject}>
                                                        {contact.subject}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        Sent: {contact.sent_at ? format(parseISO(contact.sent_at), "MMM d, yyyy 'at' h:mm a") : 'Unknown'}
                                                    </span>
                                                </div>

                                                {/* Right Section: Stats */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="flex bg-white border rounded-md shadow-sm overflow-hidden">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-gray-100 bg-gray-50/50">
                                                            <Eye className="w-4 h-4 text-emerald-600" />
                                                            <span className="text-sm font-semibold text-gray-700">{contact.unique_opens}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/50">
                                                            <MousePointerClick className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm font-semibold text-gray-700">{contact.unique_clicks}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="px-6 pb-6 pt-4 bg-gray-50/80 border-t border-gray-100">
                                                <h4 className="text-sm font-medium text-gray-700 mb-4 px-1">Engagement Details</h4>
                                                {contact.raw_events && contact.raw_events.length > 0 ? (
                                                    <div className="flex flex-col gap-4">
                                                        {contact.raw_events.map((group, idx) => {
                                                            const isOpen = group.event_type === 'open';
                                                            return (
                                                                <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                                                    {/* Group Header */}
                                                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
                                                                        <div className="flex items-start md:items-center gap-3 min-w-0 flex-col md:flex-row">
                                                                            <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${isOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                                                {isOpen ? <Eye className="w-4 h-4" /> : <MousePointerClick className="w-4 h-4" />}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className="font-semibold text-gray-900 text-sm truncate" title={isOpen ? 'Email Opened' : (group.clicked_url || 'Clicked Link')}>
                                                                                    {isOpen ? 'Email Opened' : (group.clicked_url || 'Clicked Link')}
                                                                                </div>
                                                                                {!isOpen && group.clicked_url && (
                                                                                    <a href={group.clicked_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-0.5 block truncate max-w-[400px]" title={group.clicked_url}>
                                                                                        {group.clicked_url}
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="shrink-0 flex items-center gap-2">
                                                                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                                                                {group.count} {group.count === 1 ? 'Event' : 'Events'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Group Details (Events) */}
                                                                    <div className="divide-y divide-gray-50">
                                                                        {group.events?.map((event, eIdx) => (
                                                                            <div key={eIdx} className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm hover:bg-gray-50 transition-colors">
                                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-gray-600">
                                                                                    <div className="flex items-center gap-2 min-w-[140px]">
                                                                                        <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                                                                                        <span className="font-medium">{format(parseISO(event.created_at), "MMM d, h:mm a")}</span>
                                                                                    </div>
                                                                                    {event.location && (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                                                            <span className="truncate max-w-[200px]">{event.location}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-gray-500 shrink-0">
                                                                                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                                                                                    <span className="bg-gray-50 px-2 py-0.5 rounded text-xs border border-gray-100">{event.ip_address || 'Unknown IP'}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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

                        </>
                    )}
                </div>
            )}
        </div>
    );
}

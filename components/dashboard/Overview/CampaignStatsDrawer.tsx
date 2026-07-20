"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import {
    Send,
    Eye,
    MousePointerClick,
    Reply,
    AlertTriangle,
    UserX,
    Loader2,
} from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import type { CampaignListItem, CampaignDrawerStats } from "@/types/analytics";

interface CampaignStatsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CampaignStatsDrawer({ open, onOpenChange }: CampaignStatsDrawerProps) {
    const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [stats, setStats] = useState<CampaignDrawerStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    useEffect(() => {
        if (!open) return;
        async function fetchCampaigns() {
            setLoadingCampaigns(true);
            try {
                const res = await axios.get<{ data: CampaignListItem[] }>('/api/campaigns/list');
                setCampaigns(res.data.data || []);
            } catch (err) {
                console.error('Failed to load campaigns for drawer:', err);
            } finally {
                setLoadingCampaigns(false);
            }
        }
        fetchCampaigns();
    }, [open]);

    const statsAbortRef = useRef<AbortController | null>(null);

    const fetchStats = useCallback(async () => {
        if (!selectedCampaign) {
            setStats(null);
            return;
        }
        statsAbortRef.current?.abort();
        const controller = new AbortController();
        statsAbortRef.current = controller;

        setLoading(true);
        try {
            const params: Record<string, string> = { campaign_id: selectedCampaign };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const res = await axios.get<CampaignDrawerStats>('/api/overview/campaign-stats', { params, signal: controller.signal });
            if (statsAbortRef.current === controller) {
                setStats(res.data);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error('Failed to load campaign stats:', err);
            setStats(null);
        } finally {
            if (statsAbortRef.current === controller) {
                setLoading(false);
            }
        }
    }, [selectedCampaign, startDate, endDate]);

    useEffect(() => {
        if (open && selectedCampaign) {
            fetchStats();
        }
    }, [open, fetchStats, selectedCampaign]);

    return (
        <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
            <DrawerContent style={{ width: '55vw', maxWidth: '850px' }}>
                <div className="mx-auto w-full h-screen overflow-y-auto">
                <DrawerHeader className="sticky top-0 bg-white z-60 border-b">
                    <DrawerTitle>Campaign Stats</DrawerTitle>
                </DrawerHeader>

                <div className="p-6 space-y-5">
                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Select
                            value={selectedCampaign || 'none'}
                            onValueChange={(val) => setSelectedCampaign(val === 'none' ? '' : val)}
                        >
                            <SelectTrigger className="w-[220px] h-9">
                                <SelectValue placeholder="Select campaign" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                <SelectItem value="none" disabled>Select campaign</SelectItem>
                                {loadingCampaigns ? (
                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                    campaigns.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-500">From</label>
                            <DatePicker
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="Start date"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-500">To</label>
                            <DatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="End date"
                            />
                        </div>
                    </div>

                    {/* Stats display */}
                    {!selectedCampaign ? (
                        <div className="text-center py-12 text-gray-400">
                            <p>Select a campaign to view stats</p>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : stats ? (
                        <>
                            {/* Stat Tiles */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <StatTile icon={Send} label="Sent" value={stats.total_sent} color="text-indigo-600 bg-indigo-50" />
                                <StatTile icon={Eye} label="Opened" value={stats.total_opened} color="text-emerald-600 bg-emerald-50" />
                                <StatTile icon={MousePointerClick} label="Clicked" value={stats.total_clicked} color="text-blue-600 bg-blue-50" />
                                <StatTile icon={Reply} label="Replied" value={stats.total_replied} color="text-purple-600 bg-purple-50" />
                                <StatTile icon={AlertTriangle} label="Bounced" value={stats.total_bounced} color="text-orange-600 bg-orange-50" />
                                <StatTile icon={UserX} label="Unsubscribed" value={stats.total_unsubscribed} color="text-red-600 bg-red-50" />
                            </div>

                            {/* Contacts Table */}
                            {stats.contacts.length > 0 && (
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm min-w-[650px]">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Contact</th>
                                                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Email</th>
                                                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Sent</th>
                                                <th className="text-center px-4 py-2.5 font-medium text-gray-600">Step</th>
                                                <th className="text-center px-4 py-2.5 font-medium text-gray-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {stats.contacts.map((contact) => (
                                                <tr key={`${contact.contact_id}-${contact.sent_at}`} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-2.5 font-medium text-gray-900 truncate max-w-[180px]">
                                                        {contact.contact_name}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600 truncate max-w-[200px]">
                                                        {contact.email}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                                                        {contact.sent_at ? format(parseISO(contact.sent_at), "MMM d, h:mm a") : '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <Badge variant="secondary" className="text-xs">{contact.step}</Badge>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                            {contact.opened && <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">Opened</Badge>}
                                                            {contact.clicked && <Badge className="bg-blue-100 text-blue-700 text-xs border-0">Clicked</Badge>}
                                                            {contact.replied && <Badge className="bg-purple-100 text-purple-700 text-xs border-0">Replied</Badge>}
                                                            {contact.bounced && <Badge className="bg-orange-100 text-orange-700 text-xs border-0">Bounced</Badge>}
                                                            {contact.unsubscribed && <Badge className="bg-red-100 text-red-700 text-xs border-0">Unsubscribed</Badge>}
                                                            {!contact.opened && !contact.clicked && !contact.replied && !contact.bounced && !contact.unsubscribed && (
                                                                <span className="text-xs text-gray-400">Delivered</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <p>No data available for this campaign</p>
                        </div>
                    )}
                </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function StatTile({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-white">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-gray-900">{value}</span>
            <span className="text-xs text-gray-500">{label}</span>
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/Overview/StatCard";
import { SignalTrendChart } from "@/components/dashboard/Overview/SignalTrendChart";
import { EngagementStyleChart } from "@/components/dashboard/Overview/EngagementStyleChart";
import { SocialDistributionChart } from "@/components/dashboard/Overview/SocialDistributionChart";
import { Activity, Flame, Users, Sun, MessageCircle } from "lucide-react";
import { DashboardData } from "@/app/api/overview/route";

// Types matching the JSONB structure from RPC


async function getDashboardData(): Promise<DashboardData | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_dashboard_overview");

    if (error || !data) {
        console.error("Failed to fetch dashboard data:", error);
        return null;
    }

    return data as DashboardData;
}

export default async function OverviewPage() {
    const data = await getDashboardData();

    if (!data) {
        return <div className="p-8">Loading dashboard failed. Please check logs.</div>;
    }

    const { stats, trends, socialMetrics } = data;

    // Calculate Analysis Completion Rate
    const totalAnalysis = stats.analysisMetrics.completed + stats.analysisMetrics.pending;
    const completionRate = totalAnalysis > 0
        ? Math.floor((stats.analysisMetrics.completed / totalAnalysis) * 100)
        : 0;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Zero State / Onboarding */}
            {stats.totalContacts === 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-blue-900 dark:text-blue-100">Get Started with HoneyComb</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                It looks like you haven't added any contacts yet.
                                <span className="font-semibold cursor-pointer hover:underline mx-1"> Import contacts</span>
                                or
                                <span className="font-semibold cursor-pointer hover:underline mx-1"> connect an integration</span>
                                to start seeing insights.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    title="Total Contacts"
                    value={stats.totalContacts}
                    icon={Users}
                    description="All database records"
                />
                <StatCard
                    title="Hot Opportunities"
                    value={stats.hotOpportunities}
                    icon={Flame}
                    description="High temperature leads"
                    className="bg-orange-500/10 border-orange-500/20"
                />
                <StatCard
                    title="Warm Opportunities"
                    value={stats.warmOpportunities}
                    icon={Sun}
                    description="Medium temperature leads"
                    className="bg-yellow-500/10 border-yellow-500/20"
                />
                <StatCard
                    title="Total Signals"
                    value={stats.totalSignals}
                    icon={Activity}
                    description="All-time intent signals"
                />
                <StatCard
                    title="Socially Active"
                    value={stats.sociallyActive}
                    icon={MessageCircle}
                    description="High engagement contacts"
                    className="bg-green-500/10 border-green-500/20"
                />
            </div>

            {/* Row 1: Signal Activity (75%) & Activity Level (25%) */}
            <div className="grid gap-4 md:grid-cols-4">
                <SignalTrendChart data={trends} />
                <SocialDistributionChart
                    title="Activity Level"
                    data={socialMetrics.activity_level}
                    type="donut"
                    colors={['#10b981', '#f59e0b', '#6b7280']} // Green, Amber, Gray
                />
            </div>

            {/* Row 2: Engagement Style (50%), Consistency (25%), Trend Direction (25%) */}
            <div className="grid gap-4 md:grid-cols-4">
                <EngagementStyleChart data={socialMetrics.engagement_style} />

                <SocialDistributionChart
                    title="Consistency"
                    data={socialMetrics.consistency}
                    type="donut"
                    colors={['#3b82f6', '#f97316']} // Blue, Orange
                />

                <SocialDistributionChart
                    title="Trend Direction"
                    data={socialMetrics.trend_direction}
                    type="bar"
                    colors={['#10b981', '#ef4444', '#6b7280']} // Green, Red, Gray
                />
            </div>
        </div>
    );
}

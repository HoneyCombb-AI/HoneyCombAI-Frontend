"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { StatCard } from "@/components/dashboard/Overview/StatCard";
import { SignalTrendChart } from "@/components/dashboard/Overview/SignalTrendChart";
import { EngagementStyleChart } from "@/components/dashboard/Overview/EngagementStyleChart";
import { SocialDistributionChart } from "@/components/dashboard/Overview/SocialDistributionChart";
import {
    Activity,
    Flame,
    Users,
    Sun,
    MessageCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Send,
    Mail,
} from "lucide-react";
import { DashboardData } from "@/app/api/overview/route";
import { Loading } from "@/components/loading";

export default function OverviewPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);
                const response = await axios.get<DashboardData>("/api/overview");
                setData(response.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error || err.message);
                } else {
                    setError(err instanceof Error ? err.message : "Unknown error");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
                <Loading />
                <p className="text-sm text-muted-foreground mt-4">Loading your dashboard...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex-1 p-6 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Failed to load dashboard</p>
                    <p className="text-sm text-muted-foreground">{error || "Please check logs"}</p>
                </div>
            </div>
        );
    }

    const { stats, trends, socialMetrics } = data;

    return (
        <div className="flex-1 p-6 space-y-12">

            {/* =========================
          PRIMARY KPIs
      ========================= */}
            <section>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                </div>
            </section>

            {/* =========================
          TODAY'S ACTIVITY
      ========================= */}
            <section>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <StatCard
                        title="LinkedIn Tasks Today"
                        value={stats.tasksCompletedToday}
                        icon={Send}
                        description="Outreach actions completed today"
                        className="bg-sky-500/10 border-sky-500/20"
                    />
                    <StatCard
                        title="Emails Sent Today"
                        value={stats.emailsSentToday}
                        icon={Mail}
                        description="Outbound emails sent today"
                        className="bg-indigo-500/10 border-indigo-500/20"
                    />
                </div>
            </section>

            {/* =========================
          SECONDARY KPIs
      ========================= */}
            <section>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 opacity-80">
                    <StatCard
                        title="Socially Active"
                        value={stats.sociallyActive}
                        icon={MessageCircle}
                        description="High engagement contacts"
                        className="bg-green-500/10 border-green-500/20"
                    />
                    <StatCard
                        title="Processed"
                        value={stats.analysisMetrics.completed}
                        icon={CheckCircle2}
                        description="Analysis completed"
                        className="bg-emerald-500/10 border-emerald-500/20"
                    />
                    <StatCard
                        title="Under Processing"
                        value={stats.analysisMetrics.pending}
                        icon={Clock}
                        description="Analysis in progress"
                        className="bg-blue-500/10 border-blue-500/20"
                    />
                    <StatCard
                        title="Rising Stars"
                        value={socialMetrics.momentum}
                        icon={TrendingUp}
                        description="Increasing activity trend"
                        className="bg-purple-500/10 border-purple-500/20"
                    />
                </div>
            </section>

            {/* =========================
          ANALYTICS — ROW 1
          Intent Signal Activity + Consistency
      ========================= */}
            <section className="grid grid-cols-12 gap-8 items-stretch">
                {/* LEFT */}
                <div className="col-span-12 lg:col-span-8">
                    <SignalTrendChart data={trends} />
                </div>

                {/* RIGHT — NO CARD / NO BORDER */}
                <div className="col-span-12 lg:col-span-4 flex items-center">
                    <SocialDistributionChart
                        title="Consistency"
                        data={socialMetrics.consistency}
                        type="donut"
                        colors={["#3b82f6", "#f97316"]}
                    />
                </div>
            </section>

            {/* =========================
          ANALYTICS — ROW 2
          Engagement Style + Trend Direction
      ========================= */}
            <section className="grid grid-cols-12 gap-8 items-stretch">
                {/* LEFT */}
                <div className="col-span-12 lg:col-span-8">
                    <EngagementStyleChart
                        data={socialMetrics.engagement_style}
                    />
                </div>

                {/* RIGHT — NO CARD / NO BORDER */}
                <div className="col-span-12 lg:col-span-4 flex items-center">
                    <SocialDistributionChart
                        title="Trend Direction"
                        data={socialMetrics.trend_direction}
                        type="bar"
                        colors={["#10b981", "#ef4444", "#6b7280"]}
                    />
                </div>
            </section>

        </div>
    );
}

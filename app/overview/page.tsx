import { createClient } from "@/lib/supabase/server";
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
} from "lucide-react";
import { DashboardData } from "@/app/api/overview/route";

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

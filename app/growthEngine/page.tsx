"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { KPICard } from "@/components/growthEngine/KPICard";
import { CompanyCard } from "@/components/growthEngine/CompanyCard";
import { CompanyDrawer } from "@/components/growthEngine/CompanyDrawer";
import { ContactDrawer } from "@/components/growthEngine/ContactDrawer";
import {
  Activity,
  Target,
  Users,
  TrendingUp,
  Building2,
} from "lucide-react";
import { Loading } from "@/components/loading";
import { GrowthEngineCompany } from "../api/growthEngine/companies/route";

interface KPIData {
  signalsDetected: number;
  actionsGenerated: number;
  contactsTracked: number;
  accountsTracked: number;
  avgDealHealth: number;
}


export default function ABMDashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [companies, setCompanies] = useState<GrowthEngineCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state management - handles opening company and contact drawers
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const computeKpis = (companyList: GrowthEngineCompany[]): KPIData => {
    const totals = companyList.reduce(
      (acc, company) => {
        const dealHealthValue = Number(company.deal_health);
        if (!Number.isNaN(dealHealthValue)) {
          acc.healthSum += dealHealthValue;
          acc.healthCount += 1;
        }
        acc.signals += company.signal_count ?? 0;
        acc.actions += company.action_count ?? 0;
        acc.contacts += company.contact_count ?? 0;
        return acc;
      },
      { signals: 0, actions: 0, contacts: 0, healthSum: 0, healthCount: 0 }
    );

    const accountsTracked = companyList.length;
    const avgDealHealth =
      totals.healthCount > 0 ? Math.round(totals.healthSum / totals.healthCount) : 0;

    return {
      signalsDetected: totals.signals,
      actionsGenerated: totals.actions,
      contactsTracked: totals.contacts,
      accountsTracked,
      avgDealHealth,
    };
  };

  // Fetch KPIs and companies on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch companies from Growth Engine API
        const { data: companiesData } = await axios.get("/api/growthEngine/companies");
        const companyList: GrowthEngineCompany[] = companiesData.companies || [];

        setCompanies(companyList);
        setKpis(computeKpis(companyList));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-sm text-muted-foreground mt-4">Loading your dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* KPI Cards Grid */}
      {kpis && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="Signals Detected"
              value={kpis.signalsDetected}
              description="Live intelligence triggers"
              icon={<Activity className="w-5 h-5 text-blue-600" />}
              iconBgColor="bg-blue-500/10"
            />
            <KPICard
              title="Actions Generated"
              value={kpis.actionsGenerated}
              description="AI-recommended next steps"
              icon={<Target className="w-5 h-5 text-purple-600" />}
              iconBgColor="bg-purple-500/10"
            />
            <KPICard
              title="Contacts Tracked"
              value={kpis.contactsTracked}
              description="People inside tracked accounts"
              icon={<Users className="w-5 h-5 text-orange-600" />}
              iconBgColor="bg-orange-500/10"
            />
            <KPICard
              title="Accounts Tracked"
              value={kpis.accountsTracked}
              description="Companies under active monitoring"
              icon={<Building2 className="w-5 h-5 text-green-600" />}
              iconBgColor="bg-green-500/10"
            />
            <KPICard
              title="Avg Deal Health"
              value={kpis.avgDealHealth}
              description="Average health score across accounts"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              iconBgColor="bg-emerald-500/10"
            />
            <KPICard
              title="Avg Deal Health"
              value={kpis.avgDealHealth}
              description="Average health score across accounts"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              iconBgColor="bg-emerald-500/10"
            />
          </div>
        </section>
      )}

      {/* Companies Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Tracked Organisations</h2>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Companies Yet</h3>
            <p className="text-muted-foreground">
              Upload your target account list to get started with Growth Engine
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => {
              const dealHealthNumber = Number(company.deal_health);
              const companyName =
                company.company_name ?? company.domain ?? "Unnamed Company";
              return (
                <CompanyCard
                  key={company.company_id}
                  companyId={company.company_id}
                  name={companyName}
                  domain={company.domain ?? undefined}
                  contactCount={company.contact_count ?? 0}
                  signalCount={company.signal_count ?? 0}
                  actionCount={company.action_count ?? 0}
                  onClick={() => setSelectedCompanyId(company.company_id)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Company Drawer - Opens when a company card is clicked */}
      <CompanyDrawer
        companyId={selectedCompanyId}
        open={!!selectedCompanyId}
        onOpenChange={(open) => !open && setSelectedCompanyId(null)}
        onContactClick={(contactId) => {
          // When contact is clicked in company drawer, close company drawer and open contact drawer
          setSelectedCompanyId(null);
          setSelectedContactId(contactId);
        }}
      />

      {/* Contact Drawer - Opens when a contact is clicked */}
      <ContactDrawer
        contactId={selectedContactId}
        open={!!selectedContactId}
        onOpenChange={(open) => !open && setSelectedContactId(null)}
      />
    </div>
  );
}

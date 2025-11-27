"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignalCard } from "@/components/growthEngine/SignalCard"
import { ActionRecommendationCard } from "@/components/growthEngine/ActionRecommendationCard"
import { Building2, Users, Activity, Target, ExternalLink, X, Network } from "lucide-react"
import { Loading } from "@/components/loading"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { GrowthEngineCompany } from "@/app/api/growthEngine/companies/route"
import type { CompanyContactsResponse, CompanyContactSummary } from "@/app/api/growthEngine/companies/[companyId]/contacts/route"
import type { CompanySignalsResponse, CompanySignal } from "@/app/api/growthEngine/companies/[companyId]/signals/route"
import type { CompanyActionsResponse, CompanyAction } from "@/app/api/growthEngine/companies/[companyId]/actions/route"
import type { CompanyHierarchyResponse, CompanyHierarchySegment } from "@/app/api/growthEngine/companies/[companyId]/hierarchy/route"

interface CompanyDrawerProps {
  companyId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactClick?: (contactId: string) => void
  initialCompany?: GrowthEngineCompany | null
}

export function CompanyDrawer({ companyId, open, onOpenChange, onContactClick, initialCompany }: CompanyDrawerProps) {
  const [company, setCompany] = useState<GrowthEngineCompany | null>(null)
  const [contacts, setContacts] = useState<CompanyContactSummary[]>([])
  const [signals, setSignals] = useState<CompanySignal[]>([])
  const [actions, setActions] = useState<CompanyAction[]>([])
  const [hierarchy, setHierarchy] = useState<CompanyHierarchySegment[] | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsLoaded, setContactsLoaded] = useState(false)
  const [signalsLoading, setSignalsLoading] = useState(false)
  const [actionsLoading, setActionsLoading] = useState(false)
  const [hierarchyLoading, setHierarchyLoading] = useState(false)
  const [signalsLoaded, setSignalsLoaded] = useState(false)
  const [actionsLoaded, setActionsLoaded] = useState(false)
  const [hierarchyLoaded, setHierarchyLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"contacts" | "signals" | "actions" | "hierarchy">("contacts")

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId || !open) return

      try {
        setCompany(initialCompany ?? null)
        setLoadingCompany(true)
        setError(null)
        setSignals([])
        setActions([])
        setHierarchy(null)
        setSignalsLoaded(false)
        setActionsLoaded(false)
        setHierarchyLoaded(false)
        setActiveTab("contacts")

        const companiesRes = await axios.get("/api/growthEngine/companies")
        const companies: GrowthEngineCompany[] = companiesRes.data?.companies ?? []
        setCompany(companies.find((c) => c.company_id === companyId) ?? initialCompany ?? null)

        setContactsLoading(true)
        setContactsLoaded(false)
        const contactsRes = await axios.get<CompanyContactsResponse>(`/api/growthEngine/companies/${companyId}/contacts`)
        setContacts(contactsRes.data?.contacts ?? [])
        setContactsLoading(false)
        setContactsLoaded(true)
      } catch (err) {
        console.error('Error fetching company:', err)
        setError('Failed to load company data')
        setContactsLoading(false)
      } finally {
        setLoadingCompany(false)
      }
    }

    fetchCompanyData()
  }, [companyId, open])

  useEffect(() => {
    const fetchTabData = async () => {
      if (!companyId || !open) return
      try {
        if (activeTab === "signals" && !signalsLoaded && !signalsLoading) {
          setSignalsLoading(true)
          const res = await axios.get<CompanySignalsResponse>(`/api/growthEngine/companies/${companyId}/signals`)
          setSignals(res.data?.signals ?? [])
          setSignalsLoading(false)
          setSignalsLoaded(true)
        }
        if (activeTab === "actions" && !actionsLoaded && !actionsLoading) {
          setActionsLoading(true)
          const res = await axios.get<CompanyActionsResponse>(`/api/growthEngine/companies/${companyId}/actions`)
          setActions(res.data?.actions ?? [])
          setActionsLoading(false)
          setActionsLoaded(true)
        }
        if (activeTab === "hierarchy" && !hierarchyLoaded && !hierarchyLoading) {
          setHierarchyLoading(true)
          const res = await axios.get<CompanyHierarchyResponse>(`/api/growthEngine/companies/${companyId}/hierarchy`)
          setHierarchy(res.data?.hierarchy ?? null)
          setHierarchyLoading(false)
          setHierarchyLoaded(true)
        }
      } catch (err) {
        console.error('Error fetching tab data:', err)
        setError('Failed to load company data')
        setSignalsLoading(false)
        setActionsLoading(false)
        setHierarchyLoading(false)
      }
    }

    fetchTabData()
  }, [activeTab, companyId, open, signals.length, actions.length, hierarchy, signalsLoading, actionsLoading, hierarchyLoading])

  const contactCount =
    contactsLoaded ? contacts.length : company?.contact_count ?? 0
  const signalCountDisplay =
    signalsLoaded ? signals.length : company?.signal_count ?? 0
  const actionCountDisplay =
    actionsLoaded ? actions.length : company?.action_count ?? 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent
        className="!h-screen !max-h-screen !w-screen flex flex-col !rounded-none !border-none !fixed !inset-0 !mt-0 !mb-0 !left-0 !right-0 !top-0 !bottom-0"
        style={{ height: "100vh", maxHeight: "100vh", width: "100vw" }}
      >
        <DrawerHeader className="border-b px-6">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-3">
              {company && (
                <>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {company.company_name ?? company.domain ?? "Company"}
                    </div>
                    {company.domain && (
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        {company.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </DrawerTitle>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {company && (
            <div className="flex items-center gap-6 flex-wrap mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{contactCount} Contacts</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>{signalCountDisplay} Signals</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{actionCountDisplay} Actions</span>
              </div>
            </div>
          )}
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Error Loading Company</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-4">
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="signals">Signals</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="hierarchy">Org Map</TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="space-y-4 pt-4">
                  {contactsLoading || !contactsLoaded ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading contacts...</p>
                    </div>
                  ) : contacts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {contacts.map((contact) => (
                        <Card
                          key={contact.contact_id}
                          className="hover:shadow-lg transition-all duration-300 cursor-pointer border border-muted bg-slate-50 hover:scale-[1.01]"
                          onClick={() => onContactClick?.(contact.contact_id)}
                        >
                          <CardContent className="p-4 flex items-start gap-3">
                            <Avatar className="w-12 h-12 border-2 border-primary/20">
                              {contact.profile_picture_url && (
                                <AvatarImage src={contact.profile_picture_url} alt="Profile" />
                              )}
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {(contact.full_name || contact.contact_id || "C").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base truncate">
                                {contact.full_name || "Contact"}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {contact.headline || "Stakeholder"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-semibold mb-1">No Contacts Found</h3>
                        <p className="text-muted-foreground">
                          This company does not have contacts linked yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="signals" className="space-y-4 pt-4">
                  {signalsLoading ? (
                    <div className="flex flex-col items-center justify-center w-full py-16">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-4">Loading your signals...</p>
                    </div>
                  ) : signals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {signals.map((signal) => (
                        <SignalCard
                          key={signal.signal_id}
                          signalType={signal.signal_type}
                          summary={signal.summary}
                          evidence={signal.evidence}
                          confidence={signal.confidence}
                          recommendedAction={signal.recommended_action}
                          urgency={signal.urgency}
                          reasoning={signal.reasoning}
                          sourceDate={signal.source_date}
                          linkedPriorities={signal.linked_priorities}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center flex flex-col items-center justify-center min-h-[200px]">
                        <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Signals Found</h3>
                        <p className="text-muted-foreground">
                          This account does not have signals yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 pt-4">
                  {actionsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading actions...</p>
                    </div>
                  ) : actions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {actions
                        .slice()
                        .sort((a, b) => a.action_id.localeCompare(b.action_id))
                        .map((action) => (
                          <ActionRecommendationCard
                            key={action.action_id}
                            {...action}
                          />
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Actions Generated</h3>
                        <p className="text-muted-foreground">
                          AI agent will generate action recommendations based on signals
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="hierarchy" className="space-y-4 pt-4">
                  {hierarchyLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading organization map...</p>
                    </div>
                  ) : hierarchy && hierarchy.length > 0 ? (
                    hierarchy.map((segment, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-base">
                              {segment.name ?? "Segment"}
                            </h3>
                          </div>
                          {segment.description && (
                            <p className="text-sm text-muted-foreground">{segment.description}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {segment.members?.length ?? 0} members
                          </div>
                          {segment.rationale && (
                            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                              {segment.rationale}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Organization Map Available</h3>
                        <p className="text-muted-foreground">
                          Organization hierarchy data is being processed
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

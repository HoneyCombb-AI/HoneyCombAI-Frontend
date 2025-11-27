"use client"

import { useEffect, useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrgHierarchyMap } from "@/components/growthEngine/OrgHierarchyMap"
import { SignalCard } from "@/components/growthEngine/SignalCard"
import { ActionRecommendationCard } from "@/components/growthEngine/ActionRecommendationCard"
import { Building2, Users, Activity, Target, ExternalLink, X } from "lucide-react"
import { Loading } from "@/components/loading"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface CompanyData {
  company: {
    company_id: string
    name: string
    domain?: string
    deal_health?: number
    stage?: string
    created_at: string
  }
  hierarchy?: {
    levels: {
      level: string
      contacts: Array<{
        contact_id: string
        name: string
        headline: string
        influence_score: number
        persona_label?: string
      }>
    }[]
    influence_edges?: string[]
    organization_name?: string
  }
  signals: Array<{
    signal_id: string
    signal_type: string
    summary: string
    evidence: Record<string, unknown>
    confidence?: number | string
    recommended_action: string
    urgency: string
    reasoning?: string
    source_date?: string
    linked_priorities?: string[]
  }>
  actions: Array<{
    action_id: string
    action_type: string
    description: string
    rationale?: string
    priority: string
    status: string
    target_contacts?: string[]
    valid_until?: string
  }>
  contacts: Array<{
    contact_id: string
    linkedin_urn?: string
    name: string
    headline?: string
  }>
  contactCount: number
}

interface CompanyDrawerProps {
  companyId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactClick?: (contactId: string) => void
}

export function CompanyDrawer({ companyId, open, onOpenChange, onContactClick }: CompanyDrawerProps) {
  const [data, setData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch company data when drawer opens
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId || !open) return

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/abm/companies/${companyId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch company data')
        }

        const companyData = await response.json()
        setData(companyData)
      } catch (err) {
        console.error('Error fetching company:', err)
        setError('Failed to load company data')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [companyId, open])

  // Helper function to get initials from name
  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  // Helper function to get health color
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500 bg-green-500/10"
    if (score >= 60) return "text-yellow-500 bg-yellow-500/10"
    if (score >= 40) return "text-orange-500 bg-orange-500/10"
    return "text-red-500 bg-red-500/10"
  }

  const company = data?.company
  const hierarchy = data?.hierarchy
  const signals = data?.signals || []
  const actions = data?.actions || []
  const contacts = data?.contacts || []
  const contactCount = data?.contactCount || 0
  const healthScore = typeof company?.deal_health === "number" ? company.deal_health : 0
  const hasHealthValue = company?.deal_health !== undefined
  const displayHealth = healthScore !== 0 ? healthScore : "~"

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent
        className="!h-screen !max-h-screen !w-screen flex flex-col !rounded-none !border-none !fixed !inset-0 !mt-0 !mb-0 !left-0 !right-0 !top-0 !bottom-0"
        style={{ height: "100vh", maxHeight: "100vh", width: "100vw" }}
      >
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-3">
              {company && (
                <>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{company.name}</div>
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
              {/* Deal Health Score */}
              {hasHealthValue && (
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg",
                    healthScore > 0 ? getHealthColor(healthScore) : "text-muted-foreground bg-muted"
                  )}
                >
                  <span className="text-2xl font-bold">{displayHealth}</span>
                  <span className="text-xs font-medium">Deal Health</span>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Stage and Quick Stats */}
          {company && (
            <div className="flex items-center gap-4 flex-wrap mt-3">
              {company.stage && (
                <Badge className="text-sm px-3 py-1">
                  {company.stage}
                </Badge>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{contactCount} Contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>{signals.length} Signals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>{actions.length} Actions</span>
                </div>
              </div>
            </div>
          )}
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loading />
              <p className="text-sm text-muted-foreground mt-4">Loading company data...</p>
            </div>
          ) : error || !data ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Error Loading Company</h3>
                <p className="text-muted-foreground">{error || 'Company not found'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* All Contacts Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">All Contacts</h2>
                    <p className="text-sm text-muted-foreground">
                      Click any stakeholder to view their profile
                    </p>
                  </div>
                  <Badge variant="secondary">{contactCount} total</Badge>
                </div>

                {contacts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contacts.map((contact) => (
                      <Card
                        key={contact.contact_id}
                        className="hover:shadow-lg transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-card to-card/50 hover:scale-[1.01]"
                        onClick={() => onContactClick?.(contact.contact_id)}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base truncate">{contact.name}</h3>
                              {contact.linkedin_urn && (
                                <Badge variant="outline" className="text-xs">
                                  {contact.linkedin_urn}
                                </Badge>
                              )}
                            </div>
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
              </section>

              {/* Tabs for Org Map, Signals, Actions */}
              <Separator />
              
              <Tabs defaultValue="org-map" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="org-map">Organization Map</TabsTrigger>
                  <TabsTrigger value="signals">Signals ({signals.length})</TabsTrigger>
                  <TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger>
                </TabsList>

                {/* Organization Map Tab */}
                <TabsContent value="org-map" className="space-y-6">
                  {hierarchy && hierarchy.levels && hierarchy.levels.length > 0 ? (
                    <OrgHierarchyMap
                      levels={hierarchy.levels}
                      onContactClick={onContactClick}
                    />
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

                {/* Signals Tab */}
                <TabsContent value="signals" className="space-y-4">
                  {signals.length > 0 ? (
                    signals.map((signal) => (
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
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Signals Detected</h3>
                        <p className="text-muted-foreground">
                          No intelligence signals have been captured for this account yet
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="space-y-4">
                  {actions.length > 0 ? (
                    actions.map((action) => (
                      <ActionRecommendationCard
                        key={action.action_id}
                        actionType={action.action_type}
                        description={action.description}
                        rationale={action.rationale}
                        priority={action.priority}
                        status={action.status}
                        targetContacts={action.target_contacts}
                        validUntil={action.valid_until}
                      />
                    ))
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
              </Tabs>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

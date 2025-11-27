"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Activity, Target } from "lucide-react"
// Navigation handled by parent component via onClick prop
import { cn } from "@/lib/utils"

interface CompanyCardProps {
  companyId: string
  name: string
  domain?: string
  dealHealth?: number
  stage?: string
  contactCount?: number
  signalCount?: number
  actionCount?: number
  onClick?: () => void
}

export function CompanyCard({
  companyId,
  name,
  domain,
  dealHealth,
  stage,
  contactCount = 0,
  signalCount = 0,
  actionCount = 0,
  onClick
}: CompanyCardProps) {
  const healthScore =
    typeof dealHealth === "number" && !Number.isNaN(dealHealth) ? dealHealth : 0
  const hasHealthValue = dealHealth !== undefined
  const displayHealth = healthScore !== 0 ? healthScore : "~"
  
  // Determine health color based on score
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10"
    if (score >= 60) return "bg-yellow-500/10"
    if (score >= 40) return "bg-orange-500/10"
    return "bg-red-500/10"
  }

  const getStageBadgeColor = (stage?: string) => {
    if (!stage) return "bg-gray-500/10 text-gray-600"
    const lowerStage = stage.toLowerCase()
    if (lowerStage.includes("closed") || lowerStage.includes("won")) return "bg-green-500/10 text-green-600"
    if (lowerStage.includes("proposal") || lowerStage.includes("negotiation")) return "bg-blue-500/10 text-blue-600"
    if (lowerStage.includes("meeting") || lowerStage.includes("discovery")) return "bg-purple-500/10 text-purple-600"
    if (lowerStage.includes("dormant") || lowerStage.includes("stalled")) return "bg-red-500/10 text-red-600"
    return "bg-gray-500/10 text-gray-600"
  }

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer border border-muted bg-white hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header with company name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              {domain && (
                <p className="text-sm text-muted-foreground">{domain}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stage Badge */}
        {stage && (
          <Badge className={cn("mb-3", getStageBadgeColor(stage))}>
            {stage}
          </Badge>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Contacts</span>
            </div>
            <span className="text-xl font-semibold">{contactCount}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Signals</span>
            </div>
            <span className="text-xl font-semibold">{signalCount}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span className="text-sm">Actions</span>
            </div>
            <span className="text-xl font-semibold">{actionCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

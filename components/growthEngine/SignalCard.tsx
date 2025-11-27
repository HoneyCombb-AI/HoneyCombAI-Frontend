"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, Calendar, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

type EvidenceShape =
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | { description?: string; sources?: string[]; event_count?: number }
  | null
  | undefined

interface SignalCardProps {
  signalType?: string | null
  summary?: string | null
  evidence?: EvidenceShape
  confidence?: number | string | null
  recommendedAction?: string | null
  urgency?: string | null
  reasoning?: string | null
  sourceDate?: string | null
  linkedPriorities?: string[] | null
}

export function SignalCard({
  signalType,
  summary,
  evidence,
  confidence,
  recommendedAction,
  urgency,
  reasoning,
  sourceDate,
  linkedPriorities
}: SignalCardProps) {

  const getUrgencyColor = (urgency: string) => {
    const lower = urgency.toLowerCase()
    if (lower === "critical" || lower === "high") return "bg-red-500/10 text-red-600"
    if (lower === "medium") return "bg-yellow-500/10 text-yellow-600"
    return "bg-blue-500/10 text-blue-600"
  }

  const confidenceScore = (() => {
    if (confidence === null || confidence === undefined) return 0
    if (typeof confidence === "string") {
      const parsed = parseFloat(confidence)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return confidence
  })()

  const confidencePercent = Math.round(confidenceScore * 100)

  const extractEvidenceLinks = (e: EvidenceShape) => {
    const links: string[] = []

    const scanObject = (obj: Record<string, unknown>) => {
      if (!obj || typeof obj !== "object") return

      // Explicit sources array
      if (Array.isArray(obj.sources)) {
        obj.sources.forEach((src) => {
          if (typeof src === "string") links.push(src)
        })
      }

      // Scan fields for URLs (source_url, post_url, parent_post_url, comment_url, link, etc.)
      Object.entries(obj).forEach(([key, value]) => {
        if (!/(url|link|post)/i.test(key)) return
        if (typeof value === "string") {
          links.push(value)
        } else if (Array.isArray(value)) {
          value.forEach((v) => {
            if (typeof v === "string") links.push(v)
          })
        }
      })
    }

    if (Array.isArray(e)) {
      e.forEach((item) => scanObject(item as Record<string, unknown>))
    } else if (e && typeof e === "object") {
      scanObject(e as Record<string, unknown>)
    }

    // Deduplicate and filter to plausible links
    return Array.from(new Set(links.filter(Boolean)))
  }

  const evidenceLinks = extractEvidenceLinks(evidence as Record<string, any>)
  const displaySignalType = signalType ?? "Signal"
  const displaySummary = summary ?? "No summary available"
  const displayUrgency = urgency ?? "info"
  const displayRecommendedAction = recommendedAction ?? "No recommendation provided yet."

  return (
    <Card className="border border-muted bg-white hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Header: Signal Type & Urgency */}
        <div className="flex items-start justify-between gap-2">
          <Badge className="bg-primary/10 text-primary">
            {displaySignalType}
          </Badge>
          <Badge className={cn(getUrgencyColor(displayUrgency))}>
            {displayUrgency.toUpperCase()}
          </Badge>
        </div>

        {/* Summary */}
        <div>
          <h4 className="font-semibold text-lg mb-2">{displaySummary}</h4>
          {reasoning && (
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          )}
        </div>

        {/* Evidence */}
        {evidence && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Evidence
            </div>
            {!(Array.isArray(evidence)) && (evidence as any).description && (
              <p className="text-sm text-muted-foreground">{evidence.description}</p>
            )}
            {evidenceLinks.length > 0 && (
              <div className="space-y-1">
                {evidenceLinks.slice(0, 3).map((source: string, idx: number) => (
                  <a
                    key={idx}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block truncate"
                  >
                    Source {idx + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended Action */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-primary mb-1">Recommended Action</p>
              <p className="text-sm">{displayRecommendedAction}</p>
            </div>
          </div>
        </div>

        {/* Footer: Confidence, Date, Priorities */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {/* Confidence */}
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Confidence: {confidencePercent}%</span>
            </div>
            
            {/* Source Date */}
            {sourceDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(sourceDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Linked Priorities */}
          {linkedPriorities && linkedPriorities.length > 0 && (
            <div className="flex gap-1">
              {linkedPriorities.slice(0, 2).map((priority, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {priority}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

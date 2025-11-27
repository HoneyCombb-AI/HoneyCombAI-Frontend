"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, Calendar, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompanySignal } from "@/app/api/growthEngine/companies/[companyId]/signals/route"
import type { ContactSignal } from "@/app/api/growthEngine/contacts/[contactId]/signals/route"

type EvidenceShape =
  | CompanySignal["evidence"]
  | ContactSignal["evidence"]
  | null
  | undefined

interface SignalCardProps {
  signalType?: CompanySignal["signal_type"] | ContactSignal["signal_type"]
  summary?: CompanySignal["summary"] | ContactSignal["summary"]
  evidence?: EvidenceShape
  confidence?: CompanySignal["confidence"] | ContactSignal["confidence"]
  recommendedAction?: CompanySignal["recommended_action"] | ContactSignal["recommended_action"]
  urgency?: CompanySignal["urgency"] | ContactSignal["urgency"]
  reasoning?: CompanySignal["reasoning"] | ContactSignal["reasoning"]
  sourceDate?: CompanySignal["source_date"] | ContactSignal["source_date"]
  linkedPriorities?: CompanySignal["linked_priorities"] | ContactSignal["linked_priorities"]
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

  const confidencePercent = Number.isFinite(confidenceScore) ? confidenceScore : 0

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
  const displaySignalTypeRaw = signalType ?? "Signal"
  const displaySignalType = displaySignalTypeRaw
    .toString()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
  const displaySummary = summary ?? "No summary available"
  const displayUrgency = urgency ?? "info"
  const displayRecommendedAction = recommendedAction ?? "No recommendation provided yet."

  return (
    <Card className="border border-muted bg-slate-50 hover:shadow-lg transition-shadow h-full">
      <CardContent className="p-4 space-y-3 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Badge className="bg-primary/10 text-primary w-fit text-sm">
              {displaySignalType}
            </Badge>
            {displayUrgency && (
              <Badge className={cn(getUrgencyColor(displayUrgency), "w-fit text-[11px]")}>
                {displayUrgency.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex flex-col items-end gap-1">
            {Number.isFinite(confidencePercent) && (
              <div className="flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>{confidencePercent}</span>
              </div>
            )}
            {sourceDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(sourceDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary / Reasoning */}
        <div className="space-y-2">
          <h4 className="font-semibold text-base leading-snug">{displaySummary}</h4>
          {reasoning && (
            <p className="text-sm text-muted-foreground leading-relaxed">{reasoning}</p>
          )}
        </div>

        {/* Recommended Action */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-primary">Recommended Action</p>
              <p className="text-sm leading-relaxed">{displayRecommendedAction}</p>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="mt-auto">
          {evidenceLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {evidenceLinks.slice(0, 3).map((source: string, idx: number) => (
                <a
                  key={idx}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14m-4 1v6h6" />
                  </svg>
                  Source {idx + 1}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No evidence provided.</p>
          )}
        </div>

        {/* Priorities */}
        {linkedPriorities && linkedPriorities.length > 0 && (
          <div className="flex gap-1 pt-2 border-t text-xs text-muted-foreground">
            {linkedPriorities.slice(0, 2).map((priority, idx) => (
              <Badge key={idx} variant="outline" className="text-[11px]">
                {priority}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

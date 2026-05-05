"use client"

import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DrawerAIAnalysis, DrawerSocialActivity } from "@/types/contacts"
import { Separator } from "@/components/ui/separator"
import { parseISO, format } from "date-fns"
import { TrendingUp, TrendingDown, Activity, Zap, BarChart3, Clock, Calendar, Target, LucideIcon } from "lucide-react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useFontSize } from "@/lib/font-size-context"




interface CopyButtonProps {
  onClick: (e: React.MouseEvent) => void
}

const CopyButton = React.memo(({ onClick }: CopyButtonProps) => (
  <div
    className="h-4 w-4 p-0 hover:bg-white hover:text-amber-500 cursor-pointer rounded flex items-center justify-center"
    onClick={onClick}
  >
    <Copy className="h-4 w-4" />
  </div>
))
CopyButton.displayName = 'CopyButton'



const safeparseList = (data: string | string[] | null): string[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  try {
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed)) return parsed
    return [data]
  } catch {
    return [data]
  }
}

const DetailRow = ({ label, value, className = "" }: { label: string, value: string | null, className?: string }) => {
  if (!value) return null

  const renderContent = () => {
    // Handle bullet points (common in LLM output)
    if (value.includes('•')) {
      const items = value.split('•').map(s => s.trim()).filter(s => s.length > 0)
      return (
        <ul className="space-y-2 mt-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1.5 text-[6px] shrink-0">●</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    }
    // Handle newlines
    if (value.includes('\n')) {
      return <div className="whitespace-pre-wrap">{value}</div>
    }
    return value
  }

  return (
    <div className={className}>
      <span className="font-semibold text-gray-700 block mb-0.5">{label}</span>
      <span className={`text-gray-600 leading-relaxed block ${className}`}>{renderContent()}</span>
    </div>
  )
}

const ListSection = ({ label, items, className = "" }: { label: string, items: string[], className?: string }) => {
  if (!items || items.length === 0) return null
  return (
    <div className={`space-y-1.5 ${className}`}>
      <span className="font-semibold text-gray-700 block">{label}</span>
      <ul className="list-disc list-outside ml-4 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className={`text-gray-600 leading-relaxed pl-1 ${className}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}


// ============================================================================
// SOCIAL INTELLIGENCE SECTION
// ============================================================================

interface SocialIntelligenceSectionProps {
  aiAnalysis: DrawerAIAnalysis[]
}

export function SocialIntelligenceSection({ aiAnalysis }: SocialIntelligenceSectionProps) {
  const { getFontSizeClass } = useFontSize()
  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

  const analysis = aiAnalysis?.[0]
  if (!analysis) return null

  // -- Parse Complex Fields --
  const recentDevelopments = safeparseList(analysis.recent_developments)
  const strategicPriorities = safeparseList(analysis.strategic_priorities)

  // -- Data Grouping --
  const accountOverviewHasData = analysis.role || recentDevelopments.length > 0 || strategicPriorities.length > 0 || analysis.network
  const insightsHasData = analysis.contact_insights_summary || analysis.professional_interests || analysis.communication_style || analysis.decision_indicators || analysis.motivations_triggers || analysis.influence_level

  // Don't render the section at all if there's nothing to show
  if (!accountOverviewHasData && !insightsHasData) return null

  return (
    <>
      <Separator className="my-5" />
      <div className={`space-y-4`}>

      {/* Standard Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <Zap className="h-3.5 w-3.5 fill-purple-600" />
        </div>
        <h3 className={`font-semibold text-gray-900 ${fontSizeClass}`}>Social Intelligence</h3>
      </div>

      <Accordion type="single" collapsible className="w-full">

        {/* 1. Account Overview */}
        {accountOverviewHasData && (
          <AccordionItem value="account_overview">
            <AccordionTrigger className={`font-bold text-gray-800 hover:no-underline py-3 ${fontSizeClass}`}>
              Account Overview
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <DetailRow label="Role Context" value={analysis.role} className={fontSizeClass} />
              <ListSection label="Recent Developments" items={recentDevelopments} className={fontSizeClass} />
              <ListSection label="Strategic Priorities" items={strategicPriorities} className={fontSizeClass} />
              <DetailRow label="Network & Influence" value={analysis.network} className={fontSizeClass} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 2. Contact Insights */}
        {insightsHasData && (
          <AccordionItem value="contact_insights">
            <AccordionTrigger className={`font-bold text-gray-800 hover:no-underline py-3 ${fontSizeClass}`}>
              Contact Insights
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <DetailRow label="Summary" value={analysis.contact_insights_summary} className={`italic bg-gray-50 p-3 rounded border border-gray-100 ${fontSizeClass}`} />
              <div className="grid grid-cols-1 gap-4">
                <DetailRow label="Professional Interests" value={analysis.professional_interests} className={fontSizeClass} />
                <DetailRow label="Communication Style" value={analysis.communication_style} className={fontSizeClass} />
                <DetailRow label="Decision Indicators" value={analysis.decision_indicators} className={fontSizeClass} />
                <DetailRow label="Motivations & Triggers" value={analysis.motivations_triggers} className={fontSizeClass} />
                <DetailRow label="Influence Level" value={analysis.influence_level} className={fontSizeClass} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      </div>
    </>
  )
}


// ============================================================================
// WHY REACH OUT SECTION (STANDALONE) -- REWRITTEN FOR NEW FLAT DATA
// ============================================================================



export function WhyReachOutStandalone({ analysis }: { analysis: DrawerAIAnalysis }) {
  const { getFontSizeClass } = useFontSize()
  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

  if (!analysis) return null

  const hasData = analysis.buying_signals || analysis.engagement_hooks || analysis.timing_relevance || analysis.account_relevance || analysis.current_priorities || analysis.explicit_pain_points
  if (!hasData) return null

  const copyText = `
Why Reach Out Summary:
Buying Signals: ${analysis.buying_signals || '-'}
Engagement Hooks: ${analysis.engagement_hooks || '-'}
Timing Relevance: ${analysis.timing_relevance || '-'}
Account Relevance: ${analysis.account_relevance || '-'}
Current Priorities: ${analysis.current_priorities || '-'}
Explicit Pain Points: ${analysis.explicit_pain_points || '-'}
    `.trim()

  return (
    <>
      <Separator className="my-4" />
      <div className={`space-y-3`}>

      {/* Standard Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Target className="h-3.5 w-3.5 fill-amber-600" />
          </div>
          <h3 className={`font-semibold text-gray-900 ${fontSizeClass}`}>Why Reach Out</h3>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-white hover:text-amber-500 cursor-pointer rounded-full"
          onClick={() => {
            navigator.clipboard.writeText(copyText)
              .then(() => toast.success("Why Reach Out section copied"))
              .catch(() => toast.error("Failed to copy to clipboard"))
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-4 pt-1">
        <DetailRow label="Buying Signals" value={analysis.buying_signals} className={fontSizeClass} />
        <DetailRow label="Engagement Hooks" value={analysis.engagement_hooks} className={fontSizeClass} />

        <div className="grid grid-cols-1 gap-4 pt-2">
          <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 space-y-3">
            <DetailRow label="Timing Relevance" value={analysis.timing_relevance} className={fontSizeClass} />
            <DetailRow label="Account Relevance" value={analysis.account_relevance} className={fontSizeClass} />
          </div>

          <DetailRow label="Current Priorities" value={analysis.current_priorities} className={fontSizeClass} />
          <DetailRow label="Explicit Pain Points" value={analysis.explicit_pain_points} className={fontSizeClass} />
        </div>
      </div>
      </div>
    </>
  )
}

// ============================================================================
// SOCIAL ACTIVITY SECTION
// ============================================================================

interface SocialActivitySectionProps {
  social_activity: DrawerSocialActivity
}

// ----------------------------------------------------------------------------
// Heatmap Component
// ----------------------------------------------------------------------------

interface HeatmapProps {
  data: Record<string, Record<string, number>>
}

const ActivityHeatmap = React.memo(({ data }: HeatmapProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Find max value for normalization
  const maxValue = React.useMemo(() => {
    let max = 0
    Object.values(data).forEach(dayHours => {
      Object.values(dayHours).forEach(val => {
        if (Number(val) > max) max = Number(val)
      })
    })
    return max || 1 // Avoid division by zero
  }, [data])

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100'
    const intensity = Math.ceil((value / maxValue) * 4) // 4 levels of intensity
    switch (intensity) {
      case 1: return 'bg-indigo-200'
      case 2: return 'bg-indigo-300'
      case 3: return 'bg-indigo-500'
      case 4: return 'bg-indigo-700'
      default: return 'bg-indigo-100'
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[500px] text-xs">
        {/* Hours Header */}
        <div className="flex mb-1">
          <div className="w-16 font-medium text-gray-400"></div>
          {hours.map(h => (
            <div key={h} className="flex-1 text-center text-[10px] text-gray-400">
              {h % 6 === 0 ? h : ''}
              {/* Show label every 6 hours */}
            </div>
          ))}
        </div>

        {days.map(day => {
          const dayData = data[day] || {}
          return (
            <div key={day} className="flex items-center mb-1 gap-0.5">
              <div className="w-16 text-[10px] font-medium text-gray-500 text-right pr-2">{day.slice(0, 3)}</div>
              {hours.map(h => (
                <div
                  key={h}
                  className={`flex-1 h-3 rounded-sm ${getColor(Number(dayData[String(h)] || 0))}`}
                  title={`${day} ${h}:00 - ${Number(dayData[String(h)] || 0)} actions`}
                />
              ))}
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-200"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-700"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
})
ActivityHeatmap.displayName = 'ActivityHeatmap'


// ----------------------------------------------------------------------------
// Metric Card Component
// ----------------------------------------------------------------------------

const MetricCard = ({ label, value, subtext, icon: Icon, trend, trendValue, fontSizeClass }: {
  label: string,
  value: string | number,
  subtext?: string,
  icon: LucideIcon,
  trend?: 'up' | 'down' | 'neutral',
  trendValue?: string,
  fontSizeClass?: string
}) => (
  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-1">
    <div className="flex items-center justify-between text-gray-500 font-medium">
      <span className={`flex items-center gap-1.5 ${fontSizeClass === 'text-lg' ? 'text-sm' : 'text-xs'}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      {trend && (
        <span className={`flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'} ${fontSizeClass === 'text-lg' ? 'text-xs' : 'text-[10px]'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
          {trendValue}
        </span>
      )}
    </div>
    <div className={`font-semibold text-gray-900 mt-1 ${fontSizeClass === 'text-lg' ? 'text-xl' : fontSizeClass === 'text-base' ? 'text-lg' : 'text-base'}`}>{value}</div>
    {subtext && <div className={`text-gray-400 ${fontSizeClass === 'text-lg' ? 'text-sm' : 'text-xs'}`}>{subtext}</div>}
  </div>
)

export function SocialActivitySection({ social_activity }: SocialActivitySectionProps) {
  const { getFontSizeClass } = useFontSize()
  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

  // Parse Heatmap if string
  const heatmapData = React.useMemo(() => {
    if (typeof social_activity.heatmap === 'string') {
      try {
        return JSON.parse(social_activity.heatmap)
      } catch (e) {
        console.error("Failed to parse heatmap JSON", e)
        return {}
      }
    }
    return social_activity.heatmap || {}
  }, [social_activity.heatmap])

  // Parse Primary Active Days if string
  const activeDays = React.useMemo(() => {
    if (typeof social_activity.primary_active_days === 'string') {
      try {
        const parsed = JSON.parse(social_activity.primary_active_days)
        return Array.isArray(parsed) ? parsed.join(", ") : parsed
      } catch {
        return social_activity.primary_active_days
      }
    }
    return Array.isArray(social_activity.primary_active_days) ? social_activity.primary_active_days.join(", ") : ""
  }, [social_activity.primary_active_days])


  const trendIcon = social_activity.trend_direction === 'Increasing' ? 'up' : social_activity.trend_direction === 'Decreasing' ? 'down' : 'neutral'

  return (
    <>
      <Separator className="my-5" />
      <div className="space-y-4">

        {/* Standard Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Activity className="h-3.5 w-3.5 fill-blue-600" />
            </div>
            <h3 className={`font-semibold text-gray-900 ${fontSizeClass}`}>Social Activity</h3>
          </div>
          <span className={`text-gray-400 ${fontSizeClass === 'text-lg' ? 'text-sm' : 'text-xs'}`}>
            Updated {social_activity.forecasted_at ? format(parseISO(social_activity.forecasted_at), 'MMM d') : ''}
          </span>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Weekly Actions"
            value={social_activity.total_actions}
            subtext={`Avg ${social_activity.avg_weekly_actions}/week`}
            icon={Activity}
            trend={trendIcon}
            trendValue={`${Math.abs(social_activity.trend_change_percent)}%`}
            fontSizeClass={fontSizeClass}
          />
          <MetricCard
            label="Engagement Style"
            value={social_activity.engagement_style}
            subtext={`Consistency: ${social_activity.consistency}`}
            icon={Zap}
            fontSizeClass={fontSizeClass}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 bg-white rounded border flex flex-col items-center justify-center text-center gap-1">
            <Clock className="w-4 h-4 text-blue-500 mb-1" />
            <span className={`text-gray-500 uppercase tracking-wider font-medium ${fontSizeClass === 'text-lg' ? 'text-xs' : 'text-[10px]'}`}>Best Time (UTC)</span>
            <span className={`font-semibold ${fontSizeClass}`}>{social_activity.best_time_window_utc || "N/A"}</span>
          </div>
          <div className="p-2 bg-white rounded border flex flex-col items-center justify-center text-center gap-1">
            <Calendar className="w-4 h-4 text-purple-500 mb-1" />
            <span className={`text-gray-500 uppercase tracking-wider font-medium ${fontSizeClass === 'text-lg' ? 'text-xs' : 'text-[10px]'}`}>Active Days</span>
            <span className={`font-semibold truncate w-full px-1 ${fontSizeClass}`} title={activeDays}>{activeDays || "N/A"}</span>
          </div>
          <div className="p-2 bg-white rounded border flex flex-col items-center justify-center text-center gap-1">
            <Target className="w-4 h-4 text-green-500 mb-1" />
            <span className={`text-gray-500 uppercase tracking-wider font-medium ${fontSizeClass === 'text-lg' ? 'text-xs' : 'text-[10px]'}`}>Focus</span>
            <span className={`font-semibold ${fontSizeClass}`}>
              {social_activity.outward_inward_ratio > 1 ? "Outward" : "Inward"}
            </span>
          </div>
        </div>

        {/* Heatmap */}
        <div className="border rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className={`font-semibold text-gray-700 flex items-center gap-2 ${fontSizeClass}`}>
              <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
              Activity Heatmap
            </div>
          </div>
          <ActivityHeatmap data={heatmapData} />
        </div>
      </div>
    </>
  )
}
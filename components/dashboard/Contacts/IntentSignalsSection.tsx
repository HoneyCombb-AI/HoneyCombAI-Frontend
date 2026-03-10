"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Zap, TrendingUp, Users, DollarSign, Bot, Globe, MessageSquare, ThumbsUp, Share2, FileText, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import * as chrono from 'chrono-node'
import { DrawerContactSignal } from "@/types/contacts"
import { useFontSize } from "@/lib/font-size-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface IntentSignalsSectionProps {
    signals: DrawerContactSignal[]
}

interface SourceItem {
    source_url?: string
    activity_type?: string
}

interface ProcessedSignal {
    signal: DrawerContactSignal
    recencyCategory: 'veryRecent' | 'recent' | 'other'
    timeAgo: string
    sources: SourceItem[]
    icon: LucideIcon
}

// Simple sentence case helper
const toSentenceCase = (str: string) => {
    if (!str) return ''
    const result = str.replace(/_/g, ' ')
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()
}

// Helper to pick an icon based on signal type text
const getSignalIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('growth') || t.includes('scale') || t.includes('revenue')) return TrendingUp
    if (t.includes('hiring') || t.includes('team') || t.includes('talent')) return Users
    if (t.includes('budget') || t.includes('finance') || t.includes('invest')) return DollarSign
    if (t.includes('ai') || t.includes('tech') || t.includes('tool') || t.includes('automation')) return Bot
    return Zap
}

const getRecencyCategory = (sourceDate: string | null | undefined): 'veryRecent' | 'recent' | 'other' => {
    if (!sourceDate) return 'other'

    const parsedDate = chrono.parseDate(sourceDate)
    if (!parsedDate) return 'other'

    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    if (parsedDate >= threeMonthsAgo) return 'veryRecent'
    if (parsedDate >= oneYearAgo) return 'recent'
    return 'other'
}

const getTimeAgo = (sourceDate: string | null | undefined): string => {
    if (!sourceDate) return ''

    const parsedDate = chrono.parseDate(sourceDate)
    if (!parsedDate) return ''

    const now = new Date()
    const diffMs = now.getTime() - parsedDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMonths = Math.floor(diffDays / 30)

    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
    if (diffMonths < 12) return `${diffMonths}mo`
    return `${Math.floor(diffMonths / 12)}y`
}

const getSourceIcon = (activityType?: string) => {
    switch (activityType) {
        case 'original_post': return Globe
        case 'comment': return MessageSquare
        case 'reaction': return ThumbsUp
        case 'share': return Share2
        case 'article': return FileText
        default: return ExternalLink
    }
}

const parseSources = (source: string | SourceItem | SourceItem[] | null | undefined): SourceItem[] => {
    if (!source) return []
    try {
        if (Array.isArray(source)) return source
        if (typeof source === 'string') {
            const parsed = JSON.parse(source)
            return Array.isArray(parsed) ? parsed : [parsed]
        }
        return [source]
    } catch {
        return []
    }
}

export function IntentSignalsSection({ signals }: IntentSignalsSectionProps) {
    const { getFontSizeClass } = useFontSize()
    const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

    const processedSignals = React.useMemo<ProcessedSignal[]>(() => {
        return signals.map(signal => ({
            signal,
            recencyCategory: getRecencyCategory(signal.source_date),
            timeAgo: getTimeAgo(signal.source_date),
            sources: parseSources(signal.source),
            icon: getSignalIcon(signal.signal_type || '')
        }))
    }, [signals])

    const groupedSignals = React.useMemo(() => {
        const veryRecent = processedSignals.filter(s => s.recencyCategory === 'veryRecent')
        const recent = processedSignals.filter(s => s.recencyCategory === 'recent')
        const other = processedSignals.filter(s => s.recencyCategory === 'other')
        return { veryRecent, recent, other }
    }, [processedSignals])

    if (signals.length === 0) return null

    const renderSignalCard = (processed: ProcessedSignal, index: number) => {
        const { signal, sources, icon: Icon } = processed
        let rawSignalType = signal.signal_type || ''
        // Matches "Custom" at start followed by separators (underscore, space, colon)
        const customPrefixRegex = /^custom[_\s:]+/i
        const hasCustomPrefix = customPrefixRegex.test(rawSignalType)
        const isCustom = signal.is_custom === true || hasCustomPrefix

        // Strip the prefix for the display title
        if (hasCustomPrefix) {
            rawSignalType = rawSignalType.replace(customPrefixRegex, '')
        }

        const title = toSentenceCase(rawSignalType)

        // The header content is used in both the spacer (invisible) and the actual card
        const HeaderContent = () => (
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "flex h-5 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-colors",
                        isCustom
                            ? "bg-amber-50 border-amber-100 text-amber-600"
                            : "bg-gray-50 border-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-100"
                    )}>
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className={cn("font-semibold text-gray-900 leading-tight line-clamp-1", fontSizeClass)}>
                            {title}
                        </h4>
                    </div>
                </div>

                {isCustom && (
                    <Badge variant="secondary" className="bg-amber-100/50 text-amber-700 border-amber-200/50 text-[10px] px-2 h-5 font-medium shadow-none shrink-0">
                        Custom
                    </Badge>
                )}
            </div>
        )

        return (
            <div
                key={`${signal.id}-${index}`}
                className="relative group cursor-default"
            >
                {/* Spacer: Invisible copy of the header to reserve grid space */}
                <div className="invisible p-3 border border-transparent">
                    <HeaderContent />
                </div>

                {/* Floating Card: Absolute positioned, expands on hover */}
                <div className={cn(
                    "absolute top-0 left-0 w-full rounded-xl border bg-white p-3 transition-all duration-200 ease-out origin-top",
                    "z-10 group-hover:z-50 group-hover:w-[115%] group-hover:-left-[7.5%]",
                    "group-hover:shadow-xl group-hover:ring-1",
                    isCustom
                        ? "border-amber-200/60 shadow-[0_0_15px_-3px_rgba(251,191,36,0.15)] group-hover:ring-amber-200"
                        : "border-gray-100 shadow-sm group-hover:border-blue-100 group-hover:ring-blue-100"
                )}>
                    <HeaderContent />

                    {/* Expandable Content */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out">
                        <div className="overflow-hidden">
                            <div className="pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className={cn(
                                    "relative rounded-md p-2 mb-3 text-sm leading-relaxed",
                                    isCustom ? "bg-amber-50/50" : "bg-gray-50"
                                )}>
                                    <p className={cn(
                                        "font-normal text-gray-900 text-left wrap-break-word",
                                        fontSizeClass
                                    )}>
                                        {signal.description}
                                    </p>
                                </div>

                                {/* Footer - Sources */}
                                {sources.length > 0 && (
                                    <div className="pt-1 flex items-center gap-2 px-1">
                                        <div className="flex -space-x-1.5 hover:space-x-1 transition-all">
                                            {sources.slice(0, 3).map((source, idx) => {
                                                const SourceIcon = getSourceIcon(source.activity_type)
                                                return source.source_url ? (
                                                    <TooltipProvider key={idx}>
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <a
                                                                    href={source.source_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={cn(
                                                                        "relative flex h-6 w-6 items-center justify-center rounded-full border border-white bg-gray-50 text-gray-500 shadow-sm transition-transform hover:scale-110 hover:z-10 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600",
                                                                    )}
                                                                >
                                                                    <SourceIcon className="h-3 w-3" />
                                                                </a>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="text-xs bg-gray-900 text-white border-0 z-60">
                                                                View {toSentenceCase(source.activity_type || 'source')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : null
                                            })}
                                        </div>
                                        {sources.length > 3 && (
                                            <span className="text-[10px] font-medium text-gray-400 pl-1">
                                                +{sources.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderGroup = (
        signals: ProcessedSignal[],
        title: string,
        category: 'veryRecent' | 'recent' | 'other'
    ) => {
        if (signals.length === 0) return null

        const headerStyles = {
            veryRecent: { text: "text-emerald-600", line: "bg-emerald-100" },
            recent: { text: "text-blue-600", line: "bg-blue-100" },
            other: { text: "text-gray-400", line: "bg-gray-100" }
        }

        const style = headerStyles[category]

        return (
            <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-bold uppercase tracking-widest px-1", style.text)}>
                        {title}
                    </span>
                    <div className={cn("h-px flex-1", style.line)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {signals.map((processed, idx) => renderSignalCard(processed, idx))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 px-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Zap className="h-3.5 w-3.5 fill-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Intent Signals</h3>
                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 h-5 px-2">
                    {signals.length}
                </Badge>
            </div>

            <div className="space-y-8">
                {renderGroup(groupedSignals.veryRecent, 'Very Recent', 'veryRecent')}
                {renderGroup(groupedSignals.recent, 'Recent', 'recent')}
                {renderGroup(groupedSignals.other, 'Older', 'other')}
            </div>
        </div>
    )
}

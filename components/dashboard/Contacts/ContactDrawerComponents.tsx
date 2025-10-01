"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DrawerAIAnalysis, DrawerContactNudge, DrawerSocialActivity } from "@/app/api/contacts/[id]/route"
import { sentenceCase } from "sentence-case"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatTimeSpent, getActivityLevelBadgeColor, getSectionHeadingBadgeColor } from "@/lib/ContactUtils"
import { parseISO, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Instagram, LinkedinIcon, Twitter } from "lucide-react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useFontSize } from "@/lib/font-size-context"

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const cleanInsightString = (item: string) => {
  return item
    .replace(/^\{"|"\}$/g, '')
    .replace(/":\s*"/g, ': ')
    .replace(/",\s*"/g, ', ')
}

const parseInsightItem = (item: string) => {
  const cleaned = cleanInsightString(item)
  const colonIndex = cleaned.indexOf(': ')
  if (colonIndex === -1) {
    return { label: cleaned, value: '' }
  }
  return {
    label: cleaned.slice(0, colonIndex),
    value: cleaned.slice(colonIndex + 2)
  }
}

const flattenWhyReachOut = (whyReachOut: Record<string, string> | null): string => {
  if (!whyReachOut || typeof whyReachOut !== 'object') return ''

  const lines: string[] = []
  Object.entries(whyReachOut).forEach(([key, value]) => {
    lines.push(`${sentenceCase(key)}: ${value}`)
  })
  return lines.join('\n\n')
}

const parseAccountOverviewLines = (text: string) => {
  if (!text || typeof text !== 'string') return []

  return text.split('\n').reduce<Array<{ type: 'main' | 'sub' | 'text', content: string }>>((acc, line) => {
    const trimmed = line.trim()
    if (!trimmed) return acc

    if (trimmed.startsWith('- ')) {
      acc.push({ type: 'main', content: trimmed.substring(2) })
    } else if (trimmed.startsWith('•')) {
      acc.push({ type: 'sub', content: trimmed.substring(1).trim() })
    } else {
      acc.push({ type: 'text', content: trimmed })
    }
    return acc
  }, [])
}

const parseWhyReachOutEntries = (whyReachOut: Record<string, string> | null) => {
  if (!whyReachOut || typeof whyReachOut !== 'object') return []

  const entries: Array<{ key: string, value: string }> = []
  Object.entries(whyReachOut).forEach(([key, value]) => {
    entries.push({
      key: sentenceCase(key),
      value: value
    })
  })
  return entries
}

const parseFinalAssessmentParagraphs = (text: string) => {
  if (!text || typeof text !== 'string') return []

  return text.split('\n\n')
}

// ============================================================================
// COPY HANDLERS
// ============================================================================

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copied to clipboard`)
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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

interface AccordionHeaderProps {
  title: string
  sectionKey: string
  onCopy: (e: React.MouseEvent) => void
}

const AccordionHeader = React.memo(({ title, sectionKey, onCopy }: AccordionHeaderProps) => (
  <div className="flex items-center justify-between w-full">
    <Badge className={getSectionHeadingBadgeColor(sectionKey)}>
      {title}
    </Badge>
    <CopyButton onClick={onCopy} />
  </div>
))
AccordionHeader.displayName = 'AccordionHeader'

interface AccountOverviewContentProps {
  text: string
  fontSizeClass: string
}

const AccountOverviewContent = React.memo(({ text, fontSizeClass }: AccountOverviewContentProps) => {
  const lines = React.useMemo(() => parseAccountOverviewLines(text), [text])

  return (
    <div className={`pt-2 space-y-2 text-black leading-relaxed ${fontSizeClass}`}>
      {lines.map((line, idx) => {
        if (line.type === 'main') {
          return (
            <div key={idx} className="flex items-start gap-2 mt-3 first:mt-0">
              <span className="text-blue-600 text-xs mt-1">•</span>
              <span className="flex-1">{line.content}</span>
            </div>
          )
        }
        if (line.type === 'sub') {
          return (
            <div key={idx} className="flex items-start gap-2 ml-6">
              <span className="text-blue-400 text-xs mt-1">◦</span>
              <span className="flex-1">{line.content}</span>
            </div>
          )
        }
        return <p key={idx}>{line.content}</p>
      })}
    </div>
  )
})
AccountOverviewContent.displayName = 'AccountOverviewContent'

interface ContactInsightsContentProps {
  insights: string[] | null
  fontSizeClass: string
}

const ContactInsightsContent = React.memo(({ insights, fontSizeClass }: ContactInsightsContentProps) => {
  const parsedInsights = React.useMemo(() =>
    (insights || []).map(item => parseInsightItem(item)),
    [insights]
  )

  return (
    <ul className="space-y-3 pt-2">
      {parsedInsights.map((item, i) => (
        <li key={i} className={`flex flex-col gap-1 ${fontSizeClass}`}>
          <span className="text-sm font-bold text-gray-800">{item.label}</span>
          <span className="text-black leading-relaxed pl-1">{item.value}</span>
        </li>
      ))}
    </ul>
  )
})
ContactInsightsContent.displayName = 'ContactInsightsContent'

interface WhyReachOutContentProps {
  whyReachOut: Record<string, string> | null
  fontSizeClass: string
}

const WhyReachOutContent = React.memo(({ whyReachOut, fontSizeClass }: WhyReachOutContentProps) => {
  const entries = React.useMemo(() => parseWhyReachOutEntries(whyReachOut), [whyReachOut])

  return (
    <div className={`pt-2 space-y-4 ${fontSizeClass}`}>
      {entries.map((entry, i) => (
        <div key={i} className="flex flex-col gap-2">
          <span className="text-sm font-bold text-gray-800">{entry.key}</span>
          <span className="text-black leading-relaxed pl-1">{entry.value}</span>
        </div>
      ))}
    </div>
  )
})
WhyReachOutContent.displayName = 'WhyReachOutContent'

interface FinalAssessmentContentProps {
  text: string
  fontSizeClass: string
}

const FinalAssessmentContent = React.memo(({ text, fontSizeClass }: FinalAssessmentContentProps) => {
  const paragraphs = React.useMemo(() => parseFinalAssessmentParagraphs(text), [text])

  return (
    <div className={`pt-2 space-y-3 ${fontSizeClass}`}>
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="text-black leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  )
})
FinalAssessmentContent.displayName = 'FinalAssessmentContent'

interface StrategicRecommendationsContentProps {
  recommendations: string[] | null
  fontSizeClass: string
  isLoading: boolean
  isLoaded: boolean
}

const StrategicRecommendationsContent = React.memo(({
  recommendations,
  fontSizeClass,
  isLoading,
  isLoaded
}: StrategicRecommendationsContentProps) => {
  const parsedRecommendations = React.useMemo(
    () => (recommendations || []).map(item => parseInsightItem(item)),
    [recommendations]
  )

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="font-medium">AI is analyzing strategic recommendations...</span>
        </div>
        {(recommendations || []).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-2 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <div className="w-1 h-1 bg-gray-300 rounded-full mt-3 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ul className="space-y-3 pt-2 transition-opacity duration-500 opacity-100">
      {parsedRecommendations.map((item, i) => (
        <li
          key={i}
          className={`flex flex-col gap-1 transform transition-all duration-300 ${fontSizeClass} ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-100'
          }`}
          style={{
            transitionDelay: isLoaded ? `${i * 100}ms` : '0ms'
          }}
        >
          <span className="text-sm font-semibold text-gray-800">{item.label}</span>
          <span className="text-black leading-relaxed pl-1">{item.value}</span>
        </li>
      ))}
    </ul>
  )
})
StrategicRecommendationsContent.displayName = 'StrategicRecommendationsContent'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SocialIntelligenceSectionProps {
  aiAnalysis: DrawerAIAnalysis[]
}

export function SocialIntelligenceSection({ aiAnalysis }: SocialIntelligenceSectionProps) {
  const { getFontSizeClass } = useFontSize()
  const [loadingStates, setLoadingStates] = React.useState<{ [key: string]: boolean }>({})
  const [loadedStates, setLoadedStates] = React.useState<{ [key: string]: boolean }>({})
  const [openAccordions, setOpenAccordions] = React.useState<string[]>([])
  const accordionRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({})

  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

  // Pre-compute flattened "Why Reach Out" data for copy functionality
  const flattenedWhyReachOutData = React.useMemo(() => {
    return aiAnalysis.map(analysis => flattenWhyReachOut(analysis.why_reach_out))
  }, [aiAnalysis])

  // Initialize open accordions on mount
  React.useEffect(() => {
    if (aiAnalysis?.length > 0) {
      const initialOpen = aiAnalysis.flatMap((_, index) => [
        `insights-${index}`,
        `why-reach-out-${index}`
      ])
      setOpenAccordions(initialOpen)
    }
  }, [aiAnalysis])

  const handleAccordionChange = React.useCallback((values: string[]) => {
    setOpenAccordions(prev => {
      // Check if Strategic Recommendations is being opened
      const strategicRecommendationsOpened = values.some(value =>
        value.startsWith('recommendations-') && !prev.includes(value)
      )

      if (strategicRecommendationsOpened) {
        // Close all other accordions and keep only Strategic Recommendations
        const strategicValues = values.filter(value => value.startsWith('recommendations-'))

        // Handle loading states for recommendations
        strategicValues.forEach(value => {
          if (!loadedStates[value] && !loadingStates[value]) {
            setTimeout(() => {
              const element = accordionRefs.current[value]
              if (element) {
                element.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                  inline: 'nearest'
                })
              }
            }, 100)

            setLoadingStates(prevLoading => ({ ...prevLoading, [value]: true }))

            setTimeout(() => {
              setLoadingStates(prevLoading => ({ ...prevLoading, [value]: false }))
              setLoadedStates(prevLoaded => ({ ...prevLoaded, [value]: true }))
            }, 2500)
          }
        })

        return strategicValues
      }

      // Normal accordion behavior
      // Handle loading states for newly opened recommendations
      values.forEach(value => {
        if (value.startsWith('recommendations-') && !loadedStates[value] && !loadingStates[value]) {
          setTimeout(() => {
            const element = accordionRefs.current[value]
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
              })
            }
          }, 100)

          setLoadingStates(prevLoading => ({ ...prevLoading, [value]: true }))

          setTimeout(() => {
            setLoadingStates(prevLoading => ({ ...prevLoading, [value]: false }))
            setLoadedStates(prevLoaded => ({ ...prevLoaded, [value]: true }))
          }, 2500)
        }
      })

      return values
    })
  }, [loadedStates, loadingStates])

  const handleCopy = React.useCallback((content: string[], section: string) => {
    copyToClipboard(content.join('\n'), section)
  }, [])

  if (!aiAnalysis?.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {aiAnalysis.map((analysis, index) => (
        <div key={index} className="space-y-4">
          {/* Header with tooltip */}
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${getSectionHeadingBadgeColor('social_intelligence')} cursor-help`}>
                  Social Intelligence
                </Badge>
              </TooltipTrigger>
              {analysis.confidence_reasoning && (
                <TooltipContent className="max-w-md">
                  <p className="text-sm py-1">{sentenceCase(analysis.confidence_reasoning)}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Accordion for all sections */}
          <Accordion
            type="multiple"
            className="w-full"
            value={openAccordions}
            onValueChange={handleAccordionChange}
          >
            {/* Account Overview */}
            {analysis.account_overview && (
              <AccordionItem value={`overview-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <AccordionHeader
                    title="Account Overview"
                    sectionKey="account_overview"
                    onCopy={(e) => {
                      e.stopPropagation()
                      copyToClipboard(analysis.account_overview ?? '', 'Account Overview')
                    }}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <AccountOverviewContent text={analysis.account_overview} fontSizeClass={fontSizeClass} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Contact Insights */}
            {analysis.contact_insights && analysis.contact_insights.length > 0 && (
              <AccordionItem value={`insights-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <AccordionHeader
                    title="Contact Insights"
                    sectionKey="contact_insights"
                    onCopy={(e) => {
                      e.stopPropagation()
                      handleCopy(analysis.contact_insights ?? [], 'Contact Insights')
                    }}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <ContactInsightsContent insights={analysis.contact_insights} fontSizeClass={fontSizeClass} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Why Reach Out */}
            {analysis.why_reach_out && (
              <AccordionItem value={`why-reach-out-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <AccordionHeader
                    title="Why Reach Out"
                    sectionKey="why_reach_out"
                    onCopy={(e) => {
                      e.stopPropagation()
                      copyToClipboard(flattenedWhyReachOutData[index], 'Why Reach Out')
                    }}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <WhyReachOutContent whyReachOut={analysis.why_reach_out} fontSizeClass={fontSizeClass} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Final Assessment */}
            {analysis.final_assessment && (
              <AccordionItem value={`final-assessment-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <AccordionHeader
                    title="Final Assessment"
                    sectionKey="final_assessment"
                    onCopy={(e) => {
                      e.stopPropagation()
                      copyToClipboard(analysis.final_assessment ?? '', 'Final Assessment')
                    }}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <FinalAssessmentContent text={analysis.final_assessment} fontSizeClass={fontSizeClass} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Strategic Recommendations */}
            {analysis.strategic_recommendations && analysis.strategic_recommendations.length > 0 && (
              <AccordionItem
                value={`recommendations-${index}`}
                ref={(el) => { accordionRefs.current[`recommendations-${index}`] = el }}
              >
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <AccordionHeader
                    title="Strategic Recommendations"
                    sectionKey="strategic_recommendations"
                    onCopy={(e) => {
                      e.stopPropagation()
                      handleCopy(analysis.strategic_recommendations ?? [], 'Strategic Recommendations')
                    }}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <StrategicRecommendationsContent
                    recommendations={analysis.strategic_recommendations}
                    fontSizeClass={fontSizeClass}
                    isLoading={loadingStates[`recommendations-${index}`] ?? false}
                    isLoaded={loadedStates[`recommendations-${index}`] ?? false}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// NUDGES SECTION
// ============================================================================

interface NudgesSectionProps {
  NudgesData: DrawerContactNudge | undefined
}

export function NudgesSection({ NudgesData }: NudgesSectionProps) {
  const { getFontSizeClass } = useFontSize()
  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

  const nudges = NudgesData?.nudges
  const hasNudges = nudges && nudges.length > 0

  const handleCopy = React.useCallback(() => {
    if (nudges) {
      copyToClipboard(nudges.join('\n'), 'Nudges')
    }
  }, [nudges])

  if (!hasNudges) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between mb-4">
          <Badge className={getSectionHeadingBadgeColor('social_nudges')}>
            Social Nudges
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-white hover:text-amber-500 cursor-pointer"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <ul className="space-y-2">
        {nudges.map((nudge, index) => (
          <li key={index} className={`flex items-start gap-2 text-black leading-relaxed ${fontSizeClass}`}>
            <span className="text-blue-600 mt-2 text-xs">•</span>
            <span>{nudge}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================================
// SOCIAL ACTIVITY SECTION
// ============================================================================

interface SocialActivitySectionProps {
  social_activity: DrawerSocialActivity
}

interface PlatformData {
  platform: string
  time: number
  posts: number
  icon: React.ComponentType<{ className?: string }>
}


const PlatformRow = React.memo(({
  icon: IconComponent,
  platform,
  value,
  fontSizeClass
}: {
  icon: React.ComponentType<{ className?: string }>
  platform: string
  value: string | number
  fontSizeClass: string
}) => (
  <div className={`flex items-center ${fontSizeClass}`}>
    <IconComponent className="h-4 w-4 text-gray-500 mr-2" />
    <span className="text-gray-700 mr-3">{platform}</span>
    <span className="font-medium">{value}</span>
  </div>
))
PlatformRow.displayName = 'PlatformRow'

const ApproachTimeRow = React.memo(({
  icon: IconComponent,
  platform,
  time,
  fontSizeClass
}: {
  icon: React.ComponentType<{ className?: string }>
  platform: string
  time: string | null
  fontSizeClass: string
}) => (
  <div className={`flex items-center justify-between ${fontSizeClass}`}>
    <div className="flex items-center gap-2">
      <IconComponent className="h-4 w-4 text-blue-600" />
      <span className="text-blue-700">{platform}</span>
    </div>
    <span className="font-semibold text-blue-800">{time}</span>
  </div>
))
ApproachTimeRow.displayName = 'ApproachTimeRow'

export function SocialActivitySection({ social_activity }: SocialActivitySectionProps) {
  const { getFontSizeClass } = useFontSize()
  const fontSizeClass = React.useMemo(() => getFontSizeClass(), [getFontSizeClass])

  // Memoize platform data
  const allPlatforms = React.useMemo<PlatformData[]>(() => {
    return [
      {
        platform: "LinkedIn",
        time: social_activity.linkedin_time_minutes,
        posts: social_activity.linkedin_posts_per_day,
        icon: LinkedinIcon
      },
      {
        platform: "Instagram",
        time: social_activity.instagram_time_minutes,
        posts: social_activity.instagram_posts_per_day,
        icon: Instagram
      },
      {
        platform: "Twitter",
        time: social_activity.twitter_time_minutes,
        posts: social_activity.twitter_posts_per_day,
        icon: Twitter
      }
    ].filter(item => item.time > 0 || item.posts > 0)
  }, [
    social_activity.linkedin_time_minutes,
    social_activity.linkedin_posts_per_day,
    social_activity.instagram_time_minutes,
    social_activity.instagram_posts_per_day,
    social_activity.twitter_time_minutes,
    social_activity.twitter_posts_per_day
  ])

  // Memoize approach times
  const approachTimes = React.useMemo(() => {
    return [
      { platform: "LinkedIn", time: social_activity.linkedin_best_time, icon: LinkedinIcon },
      { platform: "Instagram", time: social_activity.instagram_best_time, icon: Instagram },
      { platform: "Twitter", time: social_activity.twitter_best_time, icon: Twitter }
    ].filter(item => Boolean(item.time))
  }, [
    social_activity.linkedin_best_time,
    social_activity.instagram_best_time,
    social_activity.twitter_best_time
  ])

  // Memoize badge color
  const badgeColor = React.useMemo(
    () => getActivityLevelBadgeColor(social_activity.activity_score).replace('text-white', 'border-current'),
    [social_activity.activity_score]
  )

  // Memoize formatted date
  const formattedDate = React.useMemo(
    () => format(parseISO(social_activity.updated_at), "PPP"),
    [social_activity.updated_at]
  )

  const hasPlatformOverview = social_activity.most_used_platform_by_time || social_activity.most_engaged_platform

  return (
    <>
      <Separator className="my-5" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={getSectionHeadingBadgeColor('social_activity')}>
            Social Activity
          </Badge>
          <Badge
            variant="default"
            className={cn("text-xs px-2 py-1 border", badgeColor)}
          >
            {social_activity.activity_level}
          </Badge>
        </div>

        {/* Platform Activity Overview - Visual */}
        {hasPlatformOverview && (
          <div className="flex flex-wrap gap-2">
            {social_activity.most_used_platform_by_time && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                <span className="text-xs text-gray-600">Most active on</span>
                <Badge variant="secondary" className="text-xs">
                  {social_activity.most_used_platform_by_time}
                </Badge>
              </div>
            )}
            {social_activity.most_engaged_platform && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-xs text-blue-700">Most engaged on</span>
                <Badge variant="default" className="text-xs bg-blue-600 text-white">
                  {social_activity.most_engaged_platform}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Two-Column Layout for Time Spent and Posts */}
        {allPlatforms.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            {/* Column 1: Average time spent per day */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Average time spent per day</p>
              <div className="space-y-2">
                {allPlatforms.map((item, idx) => (
                  <PlatformRow
                    key={idx}
                    icon={item.icon}
                    platform={item.platform}
                    value={item.time > 0 ? formatTimeSpent(item.time) : '-'}
                    fontSizeClass={fontSizeClass}
                  />
                ))}
              </div>
            </div>

            {/* Column 2: Average posts per day */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Average posts per day</p>
              <div className="space-y-2">
                {allPlatforms.map((item, idx) => (
                  <PlatformRow
                    key={idx}
                    icon={item.icon}
                    platform={item.platform}
                    value={item.posts > 0 ? item.posts : '-'}
                    fontSizeClass={fontSizeClass}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Most Optimal Time to Approach */}
        {approachTimes.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-2">Most optimal time to approach</p>
            <div className="space-y-1">
              {approachTimes.map((item, idx) => (
                <ApproachTimeRow
                  key={idx}
                  icon={item.icon}
                  platform={item.platform}
                  time={item.time}
                  fontSizeClass={fontSizeClass}
                />
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-400 text-right">
          Updated {formattedDate}
        </div>
      </div>
    </>
  )
}
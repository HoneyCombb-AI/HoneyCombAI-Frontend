"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DrawerAIAnalysis, DrawerContactNudge, DrawerSocialActivity } from "@/app/api/contacts/[id]/route"
import { sentenceCase } from "sentence-case"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatTimeSpent, getActivityLevelBadgeColor } from "@/lib/ContactUtils"
import { parseISO, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Instagram, LinkedinIcon, Twitter } from "lucide-react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SocialIntelligenceSectionProps {
  aiAnalysis: DrawerAIAnalysis[]
}


export function SocialIntelligenceSection({ aiAnalysis }: SocialIntelligenceSectionProps) {
  const [loadingStates, setLoadingStates] = React.useState<{ [key: string]: boolean }>({})
  const [loadedStates, setLoadedStates] = React.useState<{ [key: string]: boolean }>({})
  const [openAccordions, setOpenAccordions] = React.useState<string[]>([])
  const accordionRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({})

  const handleCopy = (content: string[], section: string) => {
    const textToCopy = content.join('\n')
    navigator.clipboard.writeText(textToCopy)
    toast.success(`${section} copied to clipboard`)
  }

  // Initialize open accordions on mount
  React.useEffect(() => {
    if (aiAnalysis && aiAnalysis.length > 0) {
      const initialOpen: string[] = []
      aiAnalysis.forEach((_, index) => {
        initialOpen.push(`primary-${index}`)
        initialOpen.push(`detective-${index}`)
      })
      setOpenAccordions(initialOpen)
    }
  }, [aiAnalysis])

  const handleAccordionChange = (values: string[]) => {
    // Check if Strategic Recommendations is being opened
    const strategicRecommendationsOpened = values.some(value =>
      value.startsWith('recommendations-') && !openAccordions.includes(value)
    )

    if (strategicRecommendationsOpened) {
      // Close all other accordions and keep only Strategic Recommendations
      const strategicValues = values.filter(value => value.startsWith('recommendations-'))
      setOpenAccordions(strategicValues)
    } else {
      // Normal accordion behavior
      setOpenAccordions(values)
    }

    // Handle loading states for recommendations
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

        setLoadingStates(prev => ({ ...prev, [value]: true }))

        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, [value]: false }))
          setLoadedStates(prev => ({ ...prev, [value]: true }))
        }, 2500)
      }
    })
  }

  if (!aiAnalysis || aiAnalysis.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {aiAnalysis.map((analysis: DrawerAIAnalysis, index: number) => (
        <div key={index} className="space-y-4">
          {/* Header with tooltip */}
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-semibold text-gray-600 cursor-help">
                  Social Intelligence
                </h3>
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
            {/* Primary Data Analysis */}
            {analysis.primary_data_analysis && analysis.primary_data_analysis.length > 0 && (
              <AccordionItem value={`primary-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span>Primary Data Analysis</span>
                    <div
                      className="h-4 w-4 p-0 hover:bg-white hover:text-amber-500 cursor-pointer rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(analysis.primary_data_analysis ?? [], 'Primary Data Analysis')
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pt-2">
                    {analysis.primary_data_analysis.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-black  leading-relaxed">
                        <span className="text-blue-600 mt-2 text">•</span>
                        <span>{item}.</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Detective Reasoning */}
            {analysis.detective_reasoning && analysis.detective_reasoning.length > 0 && (
              <AccordionItem value={`detective-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span>Detective Reasoning</span>
                    <div
                      className="h-4 w-4 p-0 hover:bg-white hover:text-amber-500 cursor-pointer rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(analysis.detective_reasoning ?? [], 'Detective Reasoning')
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pt-2">
                    {analysis.detective_reasoning.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-black leading-relaxed">
                        <span className="text-blue-600 mt-2 text-xs">•</span>
                        <span>{item}.</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Investigative Decision */}
            {/* {analysis.investigation_decision && analysis.investigation_decision.length > 0 && (
              <AccordionItem value={`investigation-${index}`}>
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  Investigative Decision
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pt-2">
                    {analysis.investigation_decision.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                        <span className="text-blue-600 mt-2 text-xs">•</span>
                        <span>{item}.</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )} */}

            {/* Strategic Recommendations */}
            {analysis.strategic_recommendations && analysis.strategic_recommendations.length > 0 && (
              <AccordionItem
                value={`recommendations-${index}`}
                ref={(el) => { accordionRefs.current[`recommendations-${index}`] = el }}
              >
                <AccordionTrigger className="text-sm font-bold text-gray-800 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span>Strategic Recommendations</span>
                    <div
                      className="h-4 w-4 p-0 hover:bg-white hover:text-amber-500 cursor-pointer rounded flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(analysis.strategic_recommendations ?? [], 'Strategic Recommendations')
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {loadingStates[`recommendations-${index}`] ? (
                    <div className="space-y-3 pt-2">
                      {/* AI Thinking Indicator */}
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="font-medium">AI is analyzing strategic recommendations...</span>
                      </div>

                      {/* Skeleton Loading */}
                      {analysis.strategic_recommendations.map((_, i) => (
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
                  ) : (
                    <ul className={`space-y-2 pt-2 transition-opacity duration-500 ${loadedStates[`recommendations-${index}`] ? 'opacity-100' : 'opacity-100'
                      }`}>
                      {analysis.strategic_recommendations.map((item: string, i: number) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 text-sm text-black leading-relaxed transform transition-all duration-300 ${loadedStates[`recommendations-${index}`]
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-2 opacity-100'
                            }`}
                          style={{
                            transitionDelay: loadedStates[`recommendations-${index}`] ? `${i * 100}ms` : '0ms'
                          }}
                        >
                          <span className="text-blue-600 mt-2 text-xs">•</span>
                          <span>{item}.</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      ))}
    </div>
  )
}


interface NudgesSectionProps {
  NudgesData: DrawerContactNudge | undefined
}

export function NudgesSection({ NudgesData }: NudgesSectionProps) {

  if (!NudgesData?.nudges || NudgesData.nudges.length === 0) {
    return null
  }

  const handleCopy = () => {
    navigator.clipboard.writeText((NudgesData.nudges ?? []).join('\n'))
    toast.success("Nudges copied to clipboard")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600">Social Nudges</h3>
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
        {NudgesData.nudges.map((nudge: string, index: number) => (
          <li key={index} className="flex items-start gap-2 text-sm text-black leading-relaxed">
            <span className="text-blue-600 mt-2 text-xs">•</span>
            <span>{nudge}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
interface SocialActivitySection {
  social_activity: DrawerSocialActivity
}

export function SocialActivitySection({ social_activity }: SocialActivitySection) {

  return (
    <>
      <Separator className="my-5" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-600">Social Activity</h3>
          <Badge
            variant="default"
            className={cn(
              "text-xs px-2 py-1 border",
              getActivityLevelBadgeColor(social_activity.activity_score).replace('text-white', 'border-current')
            )}
          >
            {social_activity.activity_level}
          </Badge>
        </div>

        {/* Platform Activity Overview - Visual */}
        {(social_activity.most_used_platform_by_time || social_activity.most_engaged_platform) && (
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
        {(() => {
          const allPlatforms = [
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
          ].filter(item => item.time > 0 || item.posts > 0);

          return allPlatforms.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              {/* Column 1: Average time spent per day */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Average time spent per day</p>
                <div className="space-y-2">
                  {allPlatforms.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="flex items-center text-sm">
                        <IconComponent className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-700 mr-3">{item.platform}</span>
                        <span className="font-medium">{item.time > 0 ? formatTimeSpent(item.time) : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Average posts per day */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Average posts per day</p>
                <div className="space-y-2">
                  {allPlatforms.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="flex items-center text-sm">
                        <IconComponent className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-700 mr-3">{item.platform}</span>
                        <span className="font-medium">{item.posts > 0 ? item.posts : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Most Optimal Time to Approach */}
        {(() => {
          const approachTimes = [
            { platform: "LinkedIn", time: social_activity.linkedin_best_time, icon: LinkedinIcon },
            { platform: "Instagram", time: social_activity.instagram_best_time, icon: Instagram },
            { platform: "Twitter", time: social_activity.twitter_best_time, icon: Twitter }
          ].filter(item => item.time);

          return approachTimes.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-2">Most optimal time to approach</p>
              <div className="space-y-1">
                {approachTimes.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">{item.platform}</span>
                      </div>
                      <span className="font-semibold text-blue-800">{item.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Last Updated */}
        <div className="text-xs text-gray-400 text-right">
          Updated {format(parseISO(social_activity.updated_at), "PPP")}
        </div>
      </div>
    </>
  )

}
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cleanDisplayText } from "./cleanDisplayText"

interface DISCProfileProps {
  scoreD: number
  scoreI: number
  scoreS: number
  scoreC: number
  confidence?: string
  interpretation?: string
  strengths?: string[]
  weaknesses?: string[]
  recommendedAdaptation?: string
}

const normalizeText = (value?: string | null) => {
  const cleaned = cleanDisplayText(value)
  return cleaned ? cleaned : null
}

const normalizeList = (items?: string[] | null) =>
  Array.isArray(items)
    ? items
        .map((item) => cleanDisplayText(item))
        .filter((item) => Boolean(item.trim()))
    : []

export function DISCProfile({
  scoreD,
  scoreI,
  scoreS,
  scoreC,
  confidence,
  interpretation,
  strengths,
  weaknesses,
  recommendedAdaptation
}: DISCProfileProps) {
  
  const scores = [
    { label: "Dominance", value: scoreD, color: "bg-red-500", description: "Direct, results-oriented, decisive" },
    { label: "Influence", value: scoreI, color: "bg-yellow-500", description: "Enthusiastic, persuasive, social" },
    { label: "Steadiness", value: scoreS, color: "bg-green-500", description: "Patient, supportive, stable" },
    { label: "Conscientiousness", value: scoreC, color: "bg-blue-500", description: "Analytical, precise, systematic" }
  ]

  const maxScore = Math.max(scoreD, scoreI, scoreS, scoreC)
  const dominantTrait = scores.find(s => s.value === maxScore)

  const confidenceText = normalizeText(confidence)
  const interpretationText = normalizeText(interpretation)
  const strengthsList = normalizeList(strengths)
  const weaknessesList = normalizeList(weaknesses)
  const recommendedText = normalizeText(recommendedAdaptation)

  return (
    <Card className="border border-muted bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[1.05rem]">
          <span>Personality Profile</span>
          {confidenceText && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              Confidence: {confidenceText}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dominant Trait Highlight */}
        {dominantTrait && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${dominantTrait.color}`} />
              <span className="font-semibold text-sm">Primary Style: {dominantTrait.label}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{dominantTrait.description}</p>
          </div>
        )}

        {/* Score Bars */}
        <div className="space-y-4">
          {scores.map((score) => (
            <div key={score.label} className="space-y-2">
              <div className="flex items-center justify-between text-[0.95rem]">
                <span className="font-medium">{score.label}</span>
                <span className="text-muted-foreground">{score.value}/100</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${score.color} transition-all duration-500`}
                  style={{ width: `${score.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Interpretation */}
        {interpretationText && (
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2 text-[0.95rem]">Interpretation</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{interpretationText}</p>
          </div>
        )}

        {/* Strengths */}
        {strengthsList.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h4 className="font-medium text-sm">Strengths</h4>
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {strengthsList.map((strength, idx) => (
                <Badge key={idx} className="bg-green-500/10 text-green-600 text-xs px-3 py-1">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknessesList.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <h4 className="font-medium text-sm">Areas to Navigate</h4>
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {weaknessesList.map((weakness, idx) => (
                <Badge key={idx} className="bg-red-500/10 text-red-600 text-xs px-3 py-1">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Adaptation */}
        {recommendedText && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="font-medium mb-2 text-[0.95rem]">Recommended Communication Style</h4>
            <p className="text-sm leading-relaxed">{recommendedText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

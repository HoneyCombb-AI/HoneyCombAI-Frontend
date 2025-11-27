"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

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

  return (
    <Card className="border-none bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>DISC Personality Profile</span>
          {confidence && (
            <Badge variant="outline">
              Confidence: {confidence}
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
              <span className="font-semibold">Primary Style: {dominantTrait.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{dominantTrait.description}</p>
          </div>
        )}

        {/* Score Bars */}
        <div className="space-y-4">
          {scores.map((score) => (
            <div key={score.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
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
        {interpretation && (
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Interpretation</h4>
            <p className="text-sm text-muted-foreground">{interpretation}</p>
          </div>
        )}

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h4 className="font-medium">Strengths</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((strength, idx) => (
                <Badge key={idx} className="bg-green-500/10 text-green-600">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses && weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <h4 className="font-medium">Areas to Navigate</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {weaknesses.map((weakness, idx) => (
                <Badge key={idx} className="bg-red-500/10 text-red-600">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Adaptation */}
        {recommendedAdaptation && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="font-medium mb-2">Recommended Communication Style</h4>
            <p className="text-sm">{recommendedAdaptation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


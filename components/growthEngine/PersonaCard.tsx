"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Heart, Zap, AlertCircle, ThumbsUp, ThumbsDown, Target } from "lucide-react"

interface PersonaCardProps {
  summary?: string
  likes?: string[]
  dislikes?: string[]
  personalityTraits?: string[]
  cognitiveStyle?: string
  decisionStyle?: string
  riskPosture?: string
  socialBehavior?: string
  emotionalDrivers?: string[]
  frictionTriggers?: string[]
  strengths?: string[]
  weaknesses?: string[]
}

export function PersonaCard({
  summary,
  likes,
  dislikes,
  personalityTraits,
  cognitiveStyle,
  decisionStyle,
  riskPosture,
  socialBehavior,
  emotionalDrivers,
  frictionTriggers,
  strengths,
  weaknesses
}: PersonaCardProps) {
  
  return (
    <Card className="border-none bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Persona Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        {summary && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Personality Traits */}
        {personalityTraits && personalityTraits.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              Personality Traits
            </h4>
            <div className="flex flex-wrap gap-2">
              {personalityTraits.map((trait, idx) => (
                <Badge key={idx} className="bg-purple-500/10 text-purple-600">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Decision Making Styles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cognitiveStyle && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Cognitive Style</p>
              <p className="text-sm font-medium">{cognitiveStyle}</p>
            </div>
          )}
          {decisionStyle && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Decision Style</p>
              <p className="text-sm font-medium">{decisionStyle}</p>
            </div>
          )}
          {riskPosture && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Risk Posture</p>
              <p className="text-sm font-medium">{riskPosture}</p>
            </div>
          )}
          {socialBehavior && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Social Behavior</p>
              <p className="text-sm font-medium">{socialBehavior}</p>
            </div>
          )}
        </div>

        {/* Likes */}
        {likes && likes.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              Likes & Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {likes.map((like, idx) => (
                <Badge key={idx} className="bg-green-500/10 text-green-600">
                  {like}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dislikes */}
        {dislikes && dislikes.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              Dislikes & Aversions
            </h4>
            <div className="flex flex-wrap gap-2">
              {dislikes.map((dislike, idx) => (
                <Badge key={idx} className="bg-red-500/10 text-red-600">
                  {dislike}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Emotional Drivers */}
        {emotionalDrivers && emotionalDrivers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              Emotional Drivers
            </h4>
            <div className="space-y-2">
              {emotionalDrivers.map((driver, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                  <p className="text-sm">{driver}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friction Triggers */}
        {frictionTriggers && frictionTriggers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Friction Triggers (Avoid These)
            </h4>
            <div className="space-y-2">
              {frictionTriggers.map((trigger, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <p className="text-sm">{trigger}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths && strengths.length > 0 && (
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {strength}</li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses && weaknesses.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Weaknesses
              </h4>
              <ul className="space-y-1">
                {weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {weakness}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Evidence intentionally hidden per request */}
      </CardContent>
    </Card>
  )
}

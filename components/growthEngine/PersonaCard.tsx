"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ThumbsUp, ThumbsDown, Sparkles, Activity, Shield, MessageCircle } from "lucide-react";
import type { ContactPersona } from "@/app/api/growthEngine/contacts/[contactId]/persona/route";

interface PersonaCardProps {
  persona: ContactPersona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const {
    summary,
    likes,
    dislikes,
    personality_traits,
    cognitive_style,
    decision_style,
    risk_posture,
    social_behavior,
    conversation_behavior,
    emotional_drivers,
    friction_triggers,
    strengths,
    weaknesses,
  } = persona;

  return (
    <Card className="border border-muted bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Persona
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {summary && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[0.95rem] leading-relaxed">
            {summary}
          </div>
        )}

        {/* Traits */}
        {personality_traits && personality_traits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Personality Traits
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {personality_traits.map((trait, idx) => (
                <Badge key={idx} variant="secondary" className="text-[0.8rem] px-3 py-1">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Likes / Dislikes */}
        {(likes?.length || dislikes?.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {likes && likes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  Likes
                </div>
                <div className="flex flex-wrap gap-2 text-[0.95rem]">
                  {likes.map((like, idx) => (
                    <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-green-200 text-green-700">
                      {like}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {dislikes && dislikes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  Dislikes
                </div>
                <div className="flex flex-wrap gap-2 text-[0.95rem]">
                  {dislikes.map((d, idx) => (
                    <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-red-200 text-red-700">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Styles / Behaviors */}
        {(cognitive_style || decision_style || risk_posture || social_behavior || conversation_behavior) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {cognitive_style && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Cognitive style</p>
                <p className="font-medium">{cognitive_style}</p>
              </div>
            )}
            {decision_style && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Decision style</p>
                <p className="font-medium">{decision_style}</p>
              </div>
            )}
            {risk_posture && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Risk posture</p>
                <p className="font-medium">{risk_posture}</p>
              </div>
            )}
            {social_behavior && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Social behavior</p>
                <p className="font-medium">{social_behavior}</p>
              </div>
            )}
            {conversation_behavior && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Conversation behavior</p>
                <p className="font-medium">{conversation_behavior}</p>
              </div>
            )}
          </div>
        )}

        {/* Emotional drivers */}
        {emotional_drivers && emotional_drivers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="w-4 h-4 text-pink-600" />
              Emotional drivers
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {emotional_drivers.map((d, idx) => (
                <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-pink-200 text-pink-700">
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Friction triggers */}
        {friction_triggers && friction_triggers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="w-4 h-4 text-orange-600" />
              Friction triggers
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {friction_triggers.map((f, idx) => (
                <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-orange-200 text-orange-700">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        {(strengths?.length || weaknesses?.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strengths && strengths.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Strengths
                </p>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {weaknesses && weaknesses.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 space-y-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-red-600" />
                  Weaknesses
                </p>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

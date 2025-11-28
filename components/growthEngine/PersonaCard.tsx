"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ThumbsUp, ThumbsDown, Sparkles, Activity, Shield, MessageCircle } from "lucide-react";
import type { ContactPersona } from "@/app/api/growthEngine/contacts/[contactId]/persona/route";
import { cleanDisplayText } from "./cleanDisplayText";

interface PersonaCardProps {
  persona: ContactPersona;
}

const normalizeText = (value?: string | null) => {
  const cleaned = cleanDisplayText(value);
  return cleaned ? cleaned : null;
};

const normalizeList = (items?: string[] | null) =>
  Array.isArray(items)
    ? items
        .map((item) => cleanDisplayText(item))
        .filter((item) => Boolean(item.trim()))
    : [];

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

  const summaryText = normalizeText(summary);
  const likesList = normalizeList(likes);
  const dislikesList = normalizeList(dislikes);
  const traitsList = normalizeList(personality_traits);
  const cognitiveStyle = normalizeText(cognitive_style);
  const decisionStyle = normalizeText(decision_style);
  const riskPosture = normalizeText(risk_posture);
  const socialBehavior = normalizeText(social_behavior);
  const conversationBehavior = normalizeText(conversation_behavior);
  const emotionalDrivers = normalizeList(emotional_drivers);
  const frictionTriggers = normalizeList(friction_triggers);
  const strengthsList = normalizeList(strengths);
  const weaknessesList = normalizeList(weaknesses);

  return (
    <Card className="border border-muted bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Persona
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {summaryText && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[0.95rem] leading-relaxed">
            {summaryText}
          </div>
        )}

        {/* Traits */}
        {traitsList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Personality Traits
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {traitsList.map((trait, idx) => (
                <Badge key={idx} variant="secondary" className="text-[0.8rem] px-3 py-1">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Likes / Dislikes */}
        {(likesList.length || dislikesList.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {likesList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  Likes
                </div>
                <div className="flex flex-wrap gap-2 text-[0.95rem]">
                  {likesList.map((like, idx) => (
                    <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-green-200 text-green-700">
                      {like}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {dislikesList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  Dislikes
                </div>
                <div className="flex flex-wrap gap-2 text-[0.95rem]">
                  {dislikesList.map((d, idx) => (
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
        {(cognitiveStyle || decisionStyle || riskPosture || socialBehavior || conversationBehavior) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {cognitiveStyle && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Cognitive style</p>
                <p className="font-medium">{cognitiveStyle}</p>
              </div>
            )}
            {decisionStyle && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Decision style</p>
                <p className="font-medium">{decisionStyle}</p>
              </div>
            )}
            {riskPosture && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Risk posture</p>
                <p className="font-medium">{riskPosture}</p>
              </div>
            )}
            {socialBehavior && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Social behavior</p>
                <p className="font-medium">{socialBehavior}</p>
              </div>
            )}
            {conversationBehavior && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Conversation behavior</p>
                <p className="font-medium">{conversationBehavior}</p>
              </div>
            )}
          </div>
        )}

        {/* Emotional drivers */}
        {emotionalDrivers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="w-4 h-4 text-pink-600" />
              Emotional drivers
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {emotionalDrivers.map((d, idx) => (
                <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-pink-200 text-pink-700">
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Friction triggers */}
        {frictionTriggers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="w-4 h-4 text-orange-600" />
              Friction triggers
            </div>
            <div className="flex flex-wrap gap-2 text-[0.95rem]">
              {frictionTriggers.map((f, idx) => (
                <Badge key={idx} variant="outline" className="text-[0.8rem] px-3 py-1 border-orange-200 text-orange-700">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        {(strengthsList.length || weaknessesList.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strengthsList.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Strengths
                </p>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {strengthsList.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {weaknessesList.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 space-y-1">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-red-600" />
                  Weaknesses
                </p>
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {weaknessesList.map((w, idx) => (
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

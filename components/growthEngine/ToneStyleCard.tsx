"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Wand2, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { ContactToneStyle } from "@/app/api/growthEngine/contacts/[contactId]/tone-style/route";

interface ToneStyleCardProps {
  toneStyle: ContactToneStyle;
}

const cleanText = (text: string) =>
  text
    .replace(/\s*\[.*?\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function ToneStyleCard({ toneStyle }: ToneStyleCardProps) {
  return (
    <Card className="border border-muted bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[1.05rem]">
          <Wand2 className="w-5 h-5 text-primary" />
          Tone & Style Guidance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-[0.85rem] leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toneStyle.ideal_tone && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Ideal tone</p>
              <p className="font-medium">{toneStyle.ideal_tone}</p>
            </div>
          )}
          {toneStyle.ideal_style && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Ideal style</p>
              <p className="font-medium">{toneStyle.ideal_style}</p>
            </div>
          )}
          {toneStyle.tone && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Tone</p>
              <p className="font-medium">{toneStyle.tone}</p>
            </div>
          )}
          {toneStyle.structure && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Structure</p>
              <p className="font-medium">{toneStyle.structure}</p>
            </div>
          )}
          {toneStyle.emotional_tone && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Emotional tone</p>
              <p className="font-medium">{toneStyle.emotional_tone}</p>
            </div>
          )}
          {toneStyle.warmth_vs_formality && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Warmth vs formality</p>
              <p className="font-medium">{toneStyle.warmth_vs_formality}</p>
            </div>
          )}
          {toneStyle.agreement_disagreement_style && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Agreement / disagreement style</p>
              <p className="font-medium">{toneStyle.agreement_disagreement_style}</p>
            </div>
          )}
          {toneStyle.tolerance_for_detail && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Tolerance for detail</p>
              <p className="font-medium">{toneStyle.tolerance_for_detail}</p>
            </div>
          )}
          {toneStyle.pace && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Pace</p>
              <p className="font-medium">{toneStyle.pace}</p>
            </div>
          )}
          {toneStyle.structure_to_use && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Structure to use</p>
              <p className="font-medium">{toneStyle.structure_to_use}</p>
            </div>
          )}
          {toneStyle.emotional_approach && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Emotional approach</p>
              <p className="font-medium">{toneStyle.emotional_approach}</p>
            </div>
          )}
        </div>

        {/* Messaging helpers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {toneStyle.trusted_information_types && toneStyle.trusted_information_types.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Trusted information
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.trusted_information_types.map((item, idx) => (
                  <li key={idx}>{cleanText(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {toneStyle.language_patterns && toneStyle.language_patterns.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Language patterns
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.language_patterns.map((item, idx) => (
                  <li key={idx}>{cleanText(item)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Openers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {toneStyle.short_openers && toneStyle.short_openers.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Short openers</p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.short_openers.map((item, idx) => (
                  <li key={idx}>{cleanText(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {toneStyle.long_openers && toneStyle.long_openers.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Long openers</p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.long_openers.map((item, idx) => (
                  <li key={idx}>{cleanText(item)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Revival messages */}
        {toneStyle.revival_messages && toneStyle.revival_messages.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">Revival messages</p>
            <ul className="list-disc pl-4 space-y-1">
              {toneStyle.revival_messages.map((item, idx) => (
                <li key={idx}>{cleanText(item)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Do / Don't */}
        {(toneStyle.do_list?.length || toneStyle.dont_list?.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {toneStyle.do_list && toneStyle.do_list.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Do
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {toneStyle.do_list.map((d, idx) => (
                    <li key={idx}>{cleanText(d)}</li>
                  ))}
                </ul>
              </div>
            )}
            {toneStyle.dont_list && toneStyle.dont_list.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" /> Don&rsquo;t
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {toneStyle.dont_list.map((d, idx) => (
                    <li key={idx}>{cleanText(d)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Sensitivities / Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {toneStyle.sensitivities && toneStyle.sensitivities.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Sensitivities</p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.sensitivities.map((s, idx) => (
                  <li key={idx}>{cleanText(s)}</li>
                ))}
              </ul>
            </div>
          )}
          {toneStyle.behavioral_triggers && toneStyle.behavioral_triggers.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Behavioral triggers</p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.behavioral_triggers.map((b, idx) => (
                  <li key={idx}>{cleanText(b)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Topics / tones to avoid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {toneStyle.topics_to_avoid && toneStyle.topics_to_avoid.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Topics to avoid</p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.topics_to_avoid.map((t, idx) => (
                  <li key={idx}>{cleanText(t)}</li>
                ))}
              </ul>
            </div>
          )}
          {toneStyle.counterproductive_tones && toneStyle.counterproductive_tones.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Counterproductive tones</p>
              <ul className="list-disc pl-4 space-y-1">
                {toneStyle.counterproductive_tones.map((t, idx) => (
                  <li key={idx}>{cleanText(t)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Nudges */}
        {(toneStyle.affinity_nudges?.length ||
          toneStyle.context_nudges?.length ||
          toneStyle.emotional_nudges?.length ||
          toneStyle.reciprocity_nudges?.length ||
          toneStyle.curiosity_hooks?.length ||
          toneStyle.authority_cues?.length) && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2 text-[0.85rem] leading-relaxed">
            <p className="text-xs font-semibold text-primary flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Nudges
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {toneStyle.affinity_nudges && toneStyle.affinity_nudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Affinity</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {toneStyle.affinity_nudges.map((n, idx) => (
                      <li key={idx}>{cleanText(n)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toneStyle.context_nudges && toneStyle.context_nudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Context</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {toneStyle.context_nudges.map((n, idx) => (
                      <li key={idx}>{cleanText(n)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toneStyle.emotional_nudges && toneStyle.emotional_nudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Emotional</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {toneStyle.emotional_nudges.map((n, idx) => (
                      <li key={idx}>{cleanText(n)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toneStyle.reciprocity_nudges && toneStyle.reciprocity_nudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Reciprocity</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {toneStyle.reciprocity_nudges.map((n, idx) => (
                      <li key={idx}>{cleanText(n)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toneStyle.curiosity_hooks && toneStyle.curiosity_hooks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Curiosity hooks</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {toneStyle.curiosity_hooks.map((n, idx) => (
                      <li key={idx}>{cleanText(n)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {toneStyle.authority_cues && toneStyle.authority_cues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Authority cues</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {toneStyle.authority_cues.map((n, idx) => (
                      <li key={idx}>{cleanText(n)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

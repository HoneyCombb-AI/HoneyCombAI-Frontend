"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Wand2, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { ContactToneStyle } from "@/app/api/growthEngine/contacts/[contactId]/tone-style/route";
import { cleanDisplayText } from "./cleanDisplayText";

interface ToneStyleCardProps {
  toneStyle: ContactToneStyle;
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

export function ToneStyleCard({ toneStyle }: ToneStyleCardProps) {
  const idealTone = normalizeText(toneStyle.ideal_tone);
  const idealStyle = normalizeText(toneStyle.ideal_style);
  const tone = normalizeText(toneStyle.tone);
  const structure = normalizeText(toneStyle.structure);
  const emotionalTone = normalizeText(toneStyle.emotional_tone);
  const warmthVsFormality = normalizeText(toneStyle.warmth_vs_formality);
  const agreementStyle = normalizeText(toneStyle.agreement_disagreement_style);
  const toleranceForDetail = normalizeText(toneStyle.tolerance_for_detail);
  const pace = normalizeText(toneStyle.pace);
  const structureToUse = normalizeText(toneStyle.structure_to_use);
  const emotionalApproach = normalizeText(toneStyle.emotional_approach);

  const trustedInformation = normalizeList(toneStyle.trusted_information_types);
  const languagePatterns = normalizeList(toneStyle.language_patterns);
  const shortOpeners = normalizeList(toneStyle.short_openers);
  const longOpeners = normalizeList(toneStyle.long_openers);
  const revivalMessages = normalizeList(toneStyle.revival_messages);
  const doList = normalizeList(toneStyle.do_list);
  const dontList = normalizeList(toneStyle.dont_list);
  const sensitivities = normalizeList(toneStyle.sensitivities);
  const behavioralTriggers = normalizeList(toneStyle.behavioral_triggers);
  const topicsToAvoid = normalizeList(toneStyle.topics_to_avoid);
  const counterproductiveTones = normalizeList(toneStyle.counterproductive_tones);
  const affinityNudges = normalizeList(toneStyle.affinity_nudges);
  const contextNudges = normalizeList(toneStyle.context_nudges);
  const emotionalNudges = normalizeList(toneStyle.emotional_nudges);
  const reciprocityNudges = normalizeList(toneStyle.reciprocity_nudges);
  const curiosityHooks = normalizeList(toneStyle.curiosity_hooks);
  const authorityCues = normalizeList(toneStyle.authority_cues);

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
          {idealTone && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Ideal tone</p>
              <p className="font-medium">{idealTone}</p>
            </div>
          )}
          {idealStyle && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Ideal style</p>
              <p className="font-medium">{idealStyle}</p>
            </div>
          )}
          {tone && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Tone</p>
              <p className="font-medium">{tone}</p>
            </div>
          )}
          {structure && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Structure</p>
              <p className="font-medium">{structure}</p>
            </div>
          )}
          {emotionalTone && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Emotional tone</p>
              <p className="font-medium">{emotionalTone}</p>
            </div>
          )}
          {warmthVsFormality && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Warmth vs formality</p>
              <p className="font-medium">{warmthVsFormality}</p>
            </div>
          )}
          {agreementStyle && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Agreement / disagreement style</p>
              <p className="font-medium">{agreementStyle}</p>
            </div>
          )}
          {toleranceForDetail && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Tolerance for detail</p>
              <p className="font-medium">{toleranceForDetail}</p>
            </div>
          )}
          {pace && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Pace</p>
              <p className="font-medium">{pace}</p>
            </div>
          )}
          {structureToUse && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Structure to use</p>
              <p className="font-medium">{structureToUse}</p>
            </div>
          )}
          {emotionalApproach && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Emotional approach</p>
              <p className="font-medium">{emotionalApproach}</p>
            </div>
          )}
        </div>

        {/* Messaging helpers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {trustedInformation.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Trusted information
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {trustedInformation.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {languagePatterns.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Language patterns
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {languagePatterns.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Openers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {shortOpeners.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Short openers</p>
              <ul className="list-disc pl-4 space-y-1">
                {shortOpeners.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {longOpeners.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Long openers</p>
              <ul className="list-disc pl-4 space-y-1">
                {longOpeners.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Revival messages */}
        {revivalMessages.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">Revival messages</p>
            <ul className="list-disc pl-4 space-y-1">
              {revivalMessages.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Do / Don't */}
        {(doList.length || dontList.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {doList.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Do
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {doList.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {dontList.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" /> Don&rsquo;t
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {dontList.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Sensitivities / Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {sensitivities.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Sensitivities</p>
              <ul className="list-disc pl-4 space-y-1">
                {sensitivities.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {behavioralTriggers.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Behavioral triggers</p>
              <ul className="list-disc pl-4 space-y-1">
                {behavioralTriggers.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Topics / tones to avoid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {topicsToAvoid.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Topics to avoid</p>
              <ul className="list-disc pl-4 space-y-1">
                {topicsToAvoid.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {counterproductiveTones.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Counterproductive tones</p>
              <ul className="list-disc pl-4 space-y-1">
                {counterproductiveTones.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Nudges */}
        {(affinityNudges.length ||
          contextNudges.length ||
          emotionalNudges.length ||
          reciprocityNudges.length ||
          curiosityHooks.length ||
          authorityCues.length) && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2 text-[0.85rem] leading-relaxed">
            <p className="text-xs font-semibold text-primary flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Nudges
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {affinityNudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Affinity</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {affinityNudges.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {contextNudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Context</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {contextNudges.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {emotionalNudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Emotional</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {emotionalNudges.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {reciprocityNudges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Reciprocity</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {reciprocityNudges.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {curiosityHooks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Curiosity hooks</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {curiosityHooks.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {authorityCues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Authority cues</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {authorityCues.map((n, idx) => (
                      <li key={idx}>{n}</li>
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

"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DISCProfile } from "@/components/growthEngine/DISCProfile";
import {
  User,
  Briefcase,
  X,
  Mail,
  Linkedin,
  Calendar,
  Activity,
} from "lucide-react";
import { Loading } from "@/components/loading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ContactDrawerProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDrawer({
  contactId,
  open,
  onOpenChange,
}: ContactDrawerProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact data when drawer opens
  useEffect(() => {
    const fetchContactData = async () => {
      if (!contactId || !open) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/abm/contacts/${contactId}`);

        // Parse response body once so we can show better errors
        let contactData: any | { error?: string } | null =
          null;
        try {
          contactData = (await response.json()) as
            | any
            | { error?: string };
        } catch {
          contactData = null;
        }

        // Handle not-found separately so org-map only contacts don't blow up the UI
        if (!response.ok) {
          if (response.status === 404) {
            setData(null);
            setError(
              (contactData as { error?: string } | null)?.error ||
                "Contact not found in Growth Engine dataset"
            );
            return;
          }

          throw new Error(
            (contactData as { error?: string } | null)?.error ||
              "Failed to fetch contact data"
          );
        }

        setData(contactData as any);

        // Debug logging to see what data we received
        console.log("ContactDrawer Data Received:", {
          hasContact: !!(contactData as any).contact,
          hasDiscProfile: !!(contactData as any)
            .disc_profile,
          hasPersona: !!(contactData as any).persona,
          hasToneStyle: !!(contactData as any).toneStyle,
          signalsCount:
            (contactData as any).signals?.length || 0,
          hasNetwork: !!(contactData as any).network,
          personaData: (contactData as any).persona,
          toneStyleData: (contactData as any).toneStyle,
          networkData: (contactData as any).network,
          signalsData: (contactData as any).signals,
        });
      } catch (err) {
        console.error("Error fetching contact:", err);
        setError("Failed to load contact data");
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, [contactId, open]);

  // Helper function to get initials from name
  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const contact = data?.contact;
  const discProfile = data?.disc_profile;
  const persona = data?.persona;
  const toneStyle = data?.toneStyle;
  const signals = data?.signals || [];
  const network = data?.network;
  const experience = data?.experience || [];
  const company = data?.company;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent
        className="!h-screen !max-h-screen !w-screen flex flex-col !rounded-none !border-none !fixed !inset-0 !mt-0 !mb-0 !left-0 !right-0 !top-0 !bottom-0"
        style={{ height: "100vh", maxHeight: "100vh", width: "100vw" }}
      >
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-3">
              {contact && (
                <>
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-2xl font-bold">
                      {contact.full_name || "Unknown"}
                    </div>
                    {contact.headline && (
                      <p className="text-sm text-muted-foreground">
                        {contact.headline}
                      </p>
                    )}
                    {(contact.current_company || company?.name) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {contact.current_company || company?.name}
                      </p>
                    )}
                  </div>
                </>
              )}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Contact Info Quick Access */}
          {contact && (
            <div className="flex items-center gap-3 flex-wrap mt-3">
              {contact.profile_url && (
                <a
                  href={contact.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <Mail className="w-4 h-4" />
                  <span>{contact.email}</span>
                </a>
              )}
              {(contact.city || contact.location_full) && (
                <span className="text-sm text-muted-foreground">
                  {contact.city || contact.location_full}
                </span>
              )}
            </div>
          )}
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loading />
              <p className="text-sm text-muted-foreground mt-4">
                Loading contact data...
              </p>
            </div>
          ) : error || !data ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Error Loading Contact
                </h3>
                <p className="text-muted-foreground">
                  {error || "Contact not found"}
                </p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
                <TabsTrigger value="persona">Persona</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>

              {/* Overview Tab - Contact details, DISC profile, and experience */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* DISC Profile Section */}
                {discProfile && (
                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                      DISC Personality Profile
                    </h2>
                    <DISCProfile
                      scoreD={parseInt(
                        String(
                          discProfile.score_d ||
                            discProfile.dominance_score ||
                            discProfile.d_score ||
                            0
                        )
                      )}
                      scoreI={parseInt(
                        String(
                          discProfile.score_i ||
                            discProfile.influence_score ||
                            discProfile.i_score ||
                            0
                        )
                      )}
                      scoreS={parseInt(
                        String(
                          discProfile.score_s ||
                            discProfile.steadiness_score ||
                            discProfile.s_score ||
                            0
                        )
                      )}
                      scoreC={parseInt(
                        String(
                          discProfile.score_c ||
                            discProfile.conscientiousness_score ||
                            discProfile.c_score ||
                            0
                        )
                      )}
                      confidence={
                        discProfile.confidence ||
                        discProfile.confidence_score ||
                        undefined
                      }
                      interpretation={
                        discProfile.interpretation ||
                        discProfile.communication_style ||
                        undefined
                      }
                      strengths={
                        discProfile.motivators ||
                        discProfile.strengths ||
                        undefined
                      }
                      weaknesses={
                        discProfile.stressors ||
                        discProfile.weaknesses ||
                        undefined
                      }
                      recommendedAdaptation={
                        discProfile.recommended_adaptation ||
                        discProfile.communication_style ||
                        undefined
                      }
                    />
                  </section>
                )}

                {/* Experience Section - Only show if data exists */}
                {experience.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                      Professional Experience
                    </h2>
                    <div className="space-y-3">
                      {experience.map((exp, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  {exp.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {exp.company}
                                </p>
                              </div>
                              {exp.is_current && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                            {(exp.start_date || exp.end_date) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {exp.start_date || "Unknown"} -{" "}
                                  {exp.end_date || "Present"}
                                </span>
                              </div>
                            )}
                          </CardHeader>
                          {exp.description && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {exp.description}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </TabsContent>

              {/* Signals Tab - Contact signals from contact_signals table */}
              <TabsContent value="signals" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Contact Signals & Intelligence
                  </h2>
                  <Badge variant="outline">
                    {signals.length} signals detected
                  </Badge>
                </div>

                {signals.length > 0 ? (
                  <div className="space-y-6">
                    {signals.map((signal, index) => {
                      const urgency: string =
                        signal.urgency || signal.priority || "medium";
                      const confidence: number | null | undefined =
                        signal.confidence ||
                        signal.confidence_score ||
                        signal.relevance_score;

                      return (
                        <Card
                          key={
                            signal.signal_id || signal.id || `signal-${index}`
                          }
                          className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                {/* Signal Type Badge */}
                                <div className="mb-3">
                                  <Badge
                                    variant={
                                      urgency === "high" ||
                                      urgency === "critical"
                                        ? "destructive"
                                        : urgency === "days" ||
                                          urgency === "medium"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-sm font-semibold"
                                  >
                                    {signal.signal_type || "Signal"}
                                  </Badge>
                                  {urgency && (
                                    <Badge variant="outline" className="ml-2">
                                      {urgency}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {/* Confidence Score */}
                              {confidence && (
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    Confidence
                                  </p>
                                  <p className="text-2xl font-bold text-primary">
                                    {Math.round(Number(confidence) * 100)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Summary - Most Important */}
                            {signal.summary && (
                              <div>
                                <p className="text-base leading-relaxed font-medium">
                                  {signal.summary}
                                </p>
                              </div>
                            )}

                            {/* Recommended Action */}
                            {signal.recommended_action && (
                              <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                                <p className="text-sm font-semibold text-primary mb-2">
                                  💡 Recommended Action
                                </p>
                                <p className="text-sm leading-relaxed">
                                  {signal.recommended_action}
                                </p>
                              </div>
                            )}

                            {/* Reasoning */}
                            {signal.reasoning && (
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm font-semibold mb-2">
                                  Why this matters
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {signal.reasoning}
                                </p>
                              </div>
                            )}

                            {/* Source and Date */}
                            <div className="flex items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
                              {signal.source_date && (
                                <span>
                                  <strong>Date:</strong>{" "}
                                  {new Date(
                                    signal.source_date
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              {signal.linked_priorities &&
                                Array.isArray(signal.linked_priorities) && (
                                  <div className="flex items-center gap-2">
                                    <strong>Priorities:</strong>
                                    {signal.linked_priorities.map(
                                      (priority: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {priority}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-lg font-semibold mb-1">
                        No Signals Detected
                      </h3>
                      <p className="text-muted-foreground">
                        Contact signals will appear here when detected
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Persona Tab - Data from contact_disc, contact_persona, and contact_tone_style */}
              <TabsContent value="persona" className="space-y-6 mt-6">
                {/* Persona Profile */}
                {persona && Object.keys(persona).length > 0 && (
                  <section className="space-y-6">
                    <h2 className="text-xl font-semibold">
                      Persona Intelligence
                    </h2>

                    {/* Summary Card - Most Prominent */}
                    {persona.summary && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-primary">
                            Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-base leading-relaxed">
                            {persona.summary}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Key Styles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {persona.cognitive_style && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              Cognitive Style
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-semibold text-primary">
                              {persona.cognitive_style}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {persona.decision_style && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              Decision Style
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-semibold text-primary">
                              {persona.decision_style}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {persona.risk_posture && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              Risk Posture
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-semibold text-primary">
                              {persona.risk_posture}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {persona.social_behavior && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              Social Behavior
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-semibold text-primary">
                              {persona.social_behavior}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Personality Traits */}
                    {persona.personality_traits &&
                      persona.personality_traits.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Personality Traits</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {persona.personality_traits.map(
                                (trait: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-sm py-1"
                                  >
                                    {trait}
                                  </Badge>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* Likes and Dislikes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {persona.likes && persona.likes.length > 0 && (
                        <Card className="border-green-200 bg-green-50/50">
                          <CardHeader>
                            <CardTitle className="text-green-700">
                              Likes & Motivators
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {persona.likes.map(
                                (like: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <span className="text-green-600 mt-1">
                                      ✓
                                    </span>
                                    <span>{like}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                      {persona.dislikes && persona.dislikes.length > 0 && (
                        <Card className="border-red-200 bg-red-50/50">
                          <CardHeader>
                            <CardTitle className="text-red-700">
                              Dislikes & Demotivators
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {persona.dislikes.map(
                                (dislike: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <span className="text-red-600 mt-1">✗</span>
                                    <span>{dislike}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {persona.strengths && persona.strengths.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-green-600">
                              Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {persona.strengths.map(
                                (strength: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <span className="text-green-600 mt-1">
                                      ▸
                                    </span>
                                    <span>{strength}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                      {persona.weaknesses && persona.weaknesses.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-amber-600">
                              Areas to Navigate
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {persona.weaknesses.map(
                                (weakness: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <span className="text-amber-600 mt-1">
                                      ▸
                                    </span>
                                    <span>{weakness}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Emotional Drivers */}
                    {persona.emotional_drivers &&
                      persona.emotional_drivers.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Emotional Drivers</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {persona.emotional_drivers.map(
                                (driver: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-sm py-1"
                                  >
                                    {driver}
                                  </Badge>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* Friction Triggers */}
                    {persona.friction_triggers &&
                      persona.friction_triggers.length > 0 && (
                        <Card className="border-red-200">
                          <CardHeader>
                            <CardTitle className="text-red-600">
                              Friction Triggers ⚠️
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {persona.friction_triggers.map(
                                (trigger: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="destructive"
                                    className="text-sm py-1"
                                  >
                                    {trigger}
                                  </Badge>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </section>
                )}

                {/* Communication Preferences */}
                {toneStyle && Object.keys(toneStyle).length > 0 && (
                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold">
                      Communication Style
                    </h2>

                    <Card>
                      <CardHeader>
                        <CardTitle>How to Communicate</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Display each field nicely */}
                        {Object.entries(toneStyle)
                          .filter(
                            ([key]) =>
                              ![
                                "contact_id",
                                "id",
                                "created_at",
                                "updated_at",
                              ].includes(key)
                          )
                          .map(([key, value]) => {
                            if (
                              !value ||
                              (Array.isArray(value) && value.length === 0)
                            )
                              return null;

                            return (
                              <div key={key} className="space-y-2">
                                <h3 className="text-sm font-semibold capitalize text-primary">
                                  {key.replace(/_/g, " ")}
                                </h3>
                                {typeof value === "string" ||
                                typeof value === "number" ? (
                                  <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/30">
                                    {String(value)}
                                  </p>
                                ) : Array.isArray(value) ? (
                                  <div className="flex flex-wrap gap-2 pl-4">
                                    {value.map((item, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-sm"
                                      >
                                        {String(item)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                      </CardContent>
                    </Card>
                  </section>
                )}

                {(!persona || Object.keys(persona).length === 0) &&
                  (!toneStyle || Object.keys(toneStyle).length === 0) && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-semibold mb-1">
                          No Persona Data
                        </h3>
                        <p className="text-muted-foreground">
                          Persona intelligence is being generated
                        </p>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              {/* Network Tab - Interactive graph visualization using Cytoscape.js */}
              <TabsContent value="network" className="space-y-4 mt-6">
                <Card>
                  <CardContent className="p-8 text-center space-y-3">
                    <div className="text-lg font-semibold">Network graph</div>
                    <p className="text-sm text-muted-foreground">
                      Coming soon — relationship mapping is being finalized.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

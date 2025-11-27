"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Linkedin, X, Users, Activity, Network, BookOpen } from "lucide-react";
import type { ContactDetail } from "@/app/api/growthEngine/contacts/[contactId]/route";
import type { ContactSignalsResponse, ContactSignal } from "@/app/api/growthEngine/contacts/[contactId]/signals/route";
import type { ContactDiscResponse, ContactDisc } from "@/app/api/growthEngine/contacts/[contactId]/disc/route";
import type { ContactPersonaResponse, ContactPersona } from "@/app/api/growthEngine/contacts/[contactId]/persona/route";
import type { ContactToneStyleResponse, ContactToneStyle } from "@/app/api/growthEngine/contacts/[contactId]/tone-style/route";
import type { ContactTrendForecastResponse, ContactTrendForecast } from "@/app/api/growthEngine/contacts/[contactId]/trend-forecast/route";
import type { ContactNetworkResponse, ContactNetwork } from "@/app/api/growthEngine/contacts/[contactId]/network/route";
import { SignalCard } from "@/components/growthEngine/SignalCard";
import { PersonaCard } from "@/components/growthEngine/PersonaCard";
import { DISCProfile } from "@/components/growthEngine/DISCProfile";

interface ContactDrawerProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDrawer({ contactId, open, onOpenChange }: ContactDrawerProps) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [signals, setSignals] = useState<ContactSignal[]>([]);
  const [disc, setDisc] = useState<ContactDisc[]>([]);
  const [persona, setPersona] = useState<ContactPersona[]>([]);
  const [tone, setTone] = useState<ContactToneStyle[]>([]);
  const [trend, setTrend] = useState<ContactTrendForecast | null>(null);
  const [network, setNetwork] = useState<ContactNetwork | null>(null);

  const [loadingContact, setLoadingContact] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [discLoading, setDiscLoading] = useState(false);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [toneLoading, setToneLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);

  const [signalsLoaded, setSignalsLoaded] = useState(false);
  const [discLoaded, setDiscLoaded] = useState(false);
  const [personaLoaded, setPersonaLoaded] = useState(false);
  const [toneLoaded, setToneLoaded] = useState(false);
  const [trendLoaded, setTrendLoaded] = useState(false);
  const [networkLoaded, setNetworkLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"persona" | "signals" | "tone" | "network" | "profile" | "trend" | "disc">("persona");

  const resetState = () => {
    setSignals([]);
    setDisc([]);
    setPersona([]);
    setTone([]);
    setTrend(null);
    setNetwork(null);
    setSignalsLoaded(false);
    setDiscLoaded(false);
    setPersonaLoaded(false);
    setToneLoaded(false);
    setTrendLoaded(false);
    setNetworkLoaded(false);
    setActiveTab("persona");
  };

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId || !open) return;
      try {
        setLoadingContact(true);
        setError(null);
        resetState();
        const res = await axios.get<{ contact: ContactDetail | null }>(`/api/growthEngine/contacts/${contactId}`);
        setContact(res.data?.contact ?? null);
      } catch (err) {
        console.error("Error fetching contact:", err);
        setError("Failed to load contact");
      } finally {
        setLoadingContact(false);
      }
    };
    fetchContact();
  }, [contactId, open]);

  useEffect(() => {
    const fetchTabData = async () => {
      if (!contactId || !open) return;
      try {
        if (activeTab === "signals" && !signalsLoaded && !signalsLoading) {
          setSignalsLoading(true);
          const res = await axios.get<ContactSignalsResponse>(`/api/growthEngine/contacts/${contactId}/signals`);
          setSignals(res.data?.signals ?? []);
          setSignalsLoading(false);
          setSignalsLoaded(true);
        }
        if (activeTab === "persona" && !personaLoaded && !personaLoading) {
          setPersonaLoading(true);
          const personaRes = await axios.get<ContactPersonaResponse>(`/api/growthEngine/contacts/${contactId}/persona`);
          setPersona(personaRes.data?.persona ?? []);
          setPersonaLoading(false);
          setPersonaLoaded(true);
        }
        if (activeTab === "disc" && !discLoaded && !discLoading) {
          setDiscLoading(true);
          const discRes = await axios.get<ContactDiscResponse>(`/api/growthEngine/contacts/${contactId}/disc`);
          setDisc(discRes.data?.disc ?? []);
          setDiscLoading(false);
          setDiscLoaded(true);
        }
        if (activeTab === "tone" && !toneLoaded && !toneLoading) {
          setToneLoading(true);
          const res = await axios.get<ContactToneStyleResponse>(`/api/growthEngine/contacts/${contactId}/tone-style`);
          setTone(res.data?.tone_style ?? []);
          setToneLoading(false);
          setToneLoaded(true);
        }
        if (activeTab === "network" && !networkLoaded && !networkLoading) {
          setNetworkLoading(true);
          const res = await axios.get<ContactNetworkResponse>(`/api/growthEngine/contacts/${contactId}/network`);
          setNetwork(res.data?.network ?? null);
          setNetworkLoading(false);
          setNetworkLoaded(true);
        }
        if (activeTab === "trend" && !trendLoaded && !trendLoading) {
          setTrendLoading(true);
          const res = await axios.get<ContactTrendForecastResponse>(`/api/growthEngine/contacts/${contactId}/trend-forecast`);
          setTrend(res.data?.trend_forecast ?? null);
          setTrendLoading(false);
          setTrendLoaded(true);
        }
      } catch (err) {
        console.error("Error fetching contact tab data:", err);
        setError("Failed to load contact data");
        setSignalsLoading(false);
        setPersonaLoading(false);
        setDiscLoading(false);
        setToneLoading(false);
        setNetworkLoading(false);
        setTrendLoading(false);
      }
    };
    fetchTabData();
  }, [
    activeTab,
    contactId,
    open,
    signalsLoaded,
    personaLoaded,
    toneLoaded,
    networkLoaded,
    trendLoaded,
    signalsLoading,
    personaLoading,
    toneLoading,
    networkLoading,
    trendLoading,
  ]);

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

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent className="!h-screen !max-h-screen !w-screen flex flex-col !rounded-none !border-none !fixed !inset-0 !mt-0 !mb-0 !left-0 !right-0 !top-0 !bottom-0" style={{ height: "100vh", maxHeight: "100vh", width: "100vw" }}>
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-3">
              {contact && (
                <>
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    {contact.profile_picture_url && <AvatarImage src={contact.profile_picture_url} alt="Profile" />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-2xl font-bold">
                      {contact.full_name || "Unknown"}
                    </div>
                    {contact.headline && <p className="text-sm text-muted-foreground">{contact.headline}</p>}
                    {contact.current_company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {contact.current_company}
                      </p>
                    )}
                  </div>
                </>
              )}
            </DrawerTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          {contact && (
            <div className="flex items-center gap-3 flex-wrap mt-3 text-sm text-muted-foreground">
              {contact.profile_url && (
                <a href={contact.profile_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary">
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
              )}
              {contact.city && <span>{contact.city}</span>}
            </div>
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Error Loading Contact</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-6 max-w-4xl">
                  <TabsTrigger value="persona">Persona</TabsTrigger>
                  <TabsTrigger value="disc">Profile</TabsTrigger>
                  <TabsTrigger value="signals">Signals</TabsTrigger>
                  <TabsTrigger value="tone">Tone</TabsTrigger>
                  <TabsTrigger value="network">Network</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="signals" className="space-y-4 pt-4">
                  {signalsLoading ? (
                    <div className="flex flex-col items-center justify-center w-full py-16">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-4">Loading signals...</p>
                    </div>
                  ) : signals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {signals.map((signal) => (
                        <SignalCard
                          key={signal.signal_id}
                          signalType={signal.signal_type}
                          summary={signal.summary}
                          evidence={signal.evidence}
                          confidence={signal.confidence}
                          recommendedAction={signal.recommended_action}
                          urgency={signal.urgency}
                          reasoning={signal.reasoning}
                          sourceDate={signal.source_date}
                          linkedPriorities={signal.linked_priorities}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center flex flex-col items-center justify-center min-h-[200px]">
                        <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Signals Found</h3>
                        <p className="text-muted-foreground">This contact does not have signals yet.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="persona" className="space-y-4 pt-4">
                  {personaLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading persona...</p>
                    </div>
                  ) : persona.length > 0 ? (
                    <div className="space-y-3">
                      {persona.map((item) => (
                        <PersonaCard key={item.id} persona={item} />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-10 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No persona data.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="disc" className="space-y-4 pt-4">
                  {discLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading DISC...</p>
                    </div>
                  ) : disc.length > 0 ? (
                    disc.map((d) => {
                      const toScore = (val: unknown) => {
                        const num = Number(val);
                        return Number.isFinite(num) ? num : 0;
                      };
                      return (
                        <DISCProfile
                          key={d.id}
                          scoreD={toScore(d.score_d)}
                          scoreI={toScore(d.score_i)}
                          scoreS={toScore(d.score_s)}
                          scoreC={toScore(d.score_c)}
                          confidence={d.confidence ?? undefined}
                          interpretation={d.interpretation ?? undefined}
                          strengths={d.strengths ?? undefined}
                          weaknesses={d.weaknesses ?? undefined}
                          recommendedAdaptation={d.recommended_adaptation ?? undefined}
                        />
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-10 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No DISC data.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 pt-4">
                  {loadingContact ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading profile...</p>
                    </div>
                  ) : contact ? (
                    <Card>
                      <CardContent className="p-4 space-y-2 text-sm text-muted-foreground">
                        {contact.profile_url && (
                          <a href={contact.profile_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn Profile
                          </a>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </a>
                        )}
                        {contact.location_full && <p>Location: {contact.location_full}</p>}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-10 text-center">
                        <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No profile data.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="tone" className="space-y-4 pt-4">
                  {toneLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading tone/style...</p>
                    </div>
                  ) : tone.length > 0 ? (
                    tone.map((style) => (
                      <Card key={style.id}>
                        <CardContent className="p-4 space-y-2">
                          {style.ideal_tone && (
                            <p className="text-sm"><span className="font-semibold">Ideal tone:</span> {style.ideal_tone}</p>
                          )}
                          {style.ideal_style && (
                            <p className="text-sm"><span className="font-semibold">Ideal style:</span> {style.ideal_style}</p>
                          )}
                          {style.do_list && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold">Do:</span> {style.do_list.join(", ")}
                            </div>
                          )}
                          {style.dont_list && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold">Don't:</span> {style.dont_list.join(", ")}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-10 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No tone/style data.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="network" className="space-y-4 pt-4">
                  {networkLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loading />
                      <p className="text-sm text-muted-foreground mt-3">Loading network...</p>
                    </div>
                  ) : network ? (
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          Network graph data loaded
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Nodes: {Array.isArray(network.nodes) ? network.nodes.length : 0} · Edges: {Array.isArray(network.edges) ? network.edges.length : 0}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-10 text-center">
                        <Network className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No network data.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { MapPin, Mail, Phone, Flag, LinkedinIcon, Twitter, ExternalLink, Building, Clock, Languages, Instagram } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { parseISO, format } from "date-fns"
import axios from "axios"
import { toast } from "sonner"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DashboardContact } from "@/app/api/contacts/route"
import { DrawerContact } from "@/app/api/contacts/[id]/route"
import { Badge } from "@/components/ui/badge"
import { NudgesSection, SocialActivitySection, SocialIntelligenceSection } from "./ContactDrawerComponents"
import { SignalState } from "../Signal-state"
import CompleteProfileSkeleton from "./ContactsDrawerSkeleton"
import { optimizeImageUrl, getSectionHeadingBadgeColor } from "@/lib/ContactUtils"


interface DrawerDemoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  selectedContact: DashboardContact;
}
const customDrawerStyles = {
  width: '50vw',
  maxWidth: '55vw'
};

export function ContactsDrawer({ open, onOpenChange, trigger, selectedContact }: DrawerDemoProps) {
  const [drawerContact, setDrawerContact] = useState<DrawerContact | null>(null)
  const [loading, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Fetch detailed contact data when drawer opens
  useEffect(() => {
    if (open && selectedContact?.id) {
      fetchContactDetails(selectedContact.id)
      setImageError(false)
    }
  }, [open, selectedContact?.id])

  const fetchContactDetails = async (contactId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`/api/contacts/${contactId}`)
      console.log("Contact Data", response.data)
      setDrawerContact(response.data.contact)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status
        if (status === 429) {
          toast.error("Too many requests. Please wait before trying again.")
        } else if (status === 404) {
          toast.error("Contact not found.")
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.")
        } else {
          toast.error(`Failed to fetch contact details: ${err.response.statusText || 'Unknown error'}`)
        }
        setError(err.response.data?.message || err.message)
      } else if (axios.isAxiosError(err)) {
        toast.error("Network error. Please check your connection.")
        setError(err.message)
      } else {
        toast.error("An unexpected error occurred while loading contact details.")
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      }
      setDrawerContact(null)
    } finally {
      setLoading(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)
  }

  const shouldShowImage = selectedContact.profile_picture && !imageError
  const optimizedProfilePicture = selectedContact.profile_picture ? optimizeImageUrl(selectedContact.profile_picture) : null;

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent style={customDrawerStyles}>

        <div className="mx-auto w-full h-screen overflow-y-auto">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
            <DrawerTitle>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative">
                    {shouldShowImage ? (
                      <Image
                        src={optimizedProfilePicture!}
                        alt={selectedContact.full_name}
                        fill
                        sizes="120px"
                        quality={100}
                        className="object-cover rounded-full"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600
                      flex items-center justify-center text-white text-sm font-medium">
                        {getInitials(selectedContact.full_name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-medium text-gray-900 truncate">
                      <p>{selectedContact.full_name || "Unknown"}</p>
                    </div>
                  </div>
                </div>

                {/* Status Indicators */}
                {drawerContact && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Temperature Badge */}
                    {drawerContact.temperature && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 bg-gray-50/50">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            drawerContact.temperature === 'hot'
                              ? 'bg-red-500'
                              : drawerContact.temperature === 'warm'
                              ? 'bg-orange-400'
                              : 'bg-blue-400'
                          }`}
                        />
                        <span className="text-xs text-gray-600 font-medium">
                          {drawerContact.temperature.charAt(0).toUpperCase() + drawerContact.temperature.slice(1)}
                        </span>
                      </div>
                    )}

                    {/* Primary Analysis Status */}
                    {drawerContact.primary_analysis_requested && !drawerContact.primary_analysis_completed && (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50/50">
                        <div className="w-3 h-3 relative">
                          <div className="absolute inset-0 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                        <span className="text-xs text-blue-700 font-medium">
                          Analyzing Contact
                        </span>
                      </div>
                    )}

                    {drawerContact.primary_analysis_completed && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-green-200 bg-green-50/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-green-700 font-medium">
                          Analyzed
                        </span>
                      </div>
                    )}

                    {/* Tracking Status */}
                    {drawerContact.istracked && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-200 bg-purple-50/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <span className="text-xs text-purple-700 font-medium">
                          Tracked
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              <div className="flex w-full justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="text-md font-semibold text-gray-600"
                    title={selectedContact.title || "No title"}
                  >
                    {selectedContact.title || ""}
                  </div>
                  {selectedContact.company?.name && (
                    <>
                      <div className="text-sm text-gray-500">
                        at {selectedContact.company.name}
                      </div>
                    </>
                  )}
                </div>

                {/* Company Redirect */}
                {selectedContact.company && (
                  <div className="cursor-pointer" onClick={() => window.open(`/dashboard/companies/${selectedContact.company_id}`, '_blank')} >
                    <div className="w-8 h-8 rounded relative overflow-hidden flex-shrink-0">
                      {selectedContact.company?.logo_url ? (
                        <Image
                          src={selectedContact.company.logo_url}
                          alt="Company logo"
                          fill
                          sizes="120px"
                          quality={100}
                          className="object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center font-semibold">
                          {selectedContact.company?.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DrawerHeader>
          {loading ? (
            <CompleteProfileSkeleton />

          ) : (
            <div className="px-6 py-2 space-y-3">
              {drawerContact?.signals && drawerContact.signals.length > 0 && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getSectionHeadingBadgeColor('social_intents')}>
                        Social Intents
                      </Badge>
                    </div>
                    <SignalState
                      signals={drawerContact.signals}
                      contactId={drawerContact.id || selectedContact.id}
                      showTooltips={true}
                      detailed={true}
                      className="gap-2"
                    />
                  </div>
                  <Separator className="my-4" />
                </>
              )}
              <div className="flex gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getSectionHeadingBadgeColor('personal_information')}>
                      Personal Information
                    </Badge>
                  </div>

                  {/* Two-column layout for personal information */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Column 1: 5 items */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {[drawerContact?.city || selectedContact.city, drawerContact?.state || selectedContact.state]
                            .filter(Boolean)
                            .join(", ") || "No location provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Flag className="h-4 w-4" />
                        <span>{drawerContact?.country || selectedContact.country || "No country provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{drawerContact?.email || "No email provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{drawerContact?.phone || "No phone provided"}</span>
                      </div>

                      {/* Languages - moved to column 1 */}
                      {drawerContact?.languages && drawerContact.languages.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                            <Languages className="h-4 w-4" />
                            <span>Languages</span>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-7">
                            {drawerContact.languages.map((language: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                                {language}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column 2: 5 items */}
                    <div className="space-y-4">
                      {/* LinkedIn - moved to first item in column 2 */}
                      <div className="flex items-center gap-3 text-sm">
                        <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
                        {drawerContact?.linkedin_url ? (
                          <a
                            href={drawerContact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            LinkedIn Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-600">No LinkedIn profile</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                        {drawerContact?.twitter_handle ? (
                          <a
                            href={`https://twitter.com/${drawerContact.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            @{drawerContact.twitter_handle}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-600">No X profile</span>
                        )}
                      </div>

                      {/* Instagram Handle */}
                      <div className="flex items-center gap-3 text-sm">
                        <Instagram className="h-4 w-4 text-[#E4405F]" />
                        {drawerContact?.instagram_handle ? (
                          <a
                            href={`https://instagram.com/${drawerContact.instagram_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            @{drawerContact.instagram_handle}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-600">No Instagram profile</span>
                        )}
                      </div>

                      {selectedContact.company?.industry && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Building className="h-4 w-6" />
                          <span>Works in {selectedContact.company?.industry}</span>
                        </div>
                      )}

                      {/* Profile updated - moved to last item in column 2 */}
                      {drawerContact?.updated_at && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Clock className="h-4 w-5" />
                          <span>Profile updated on {drawerContact.updated_at
                            ? format(parseISO(drawerContact.updated_at), "PPP")
                            : "—"
                          }</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topics of Interest - Full width below the columns */}
                  {drawerContact?.topics && drawerContact.topics.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-semibold text-gray-600">
                        Topics of Interest
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {drawerContact.topics.map((topic: string, idx: number) => (
                          <Badge key={idx} className="w-fit" variant="outline">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {drawerContact?.nudges?.[0] && (
                <>
                  <Separator className="my-5" />
                  <NudgesSection NudgesData={drawerContact?.nudges?.[0]} />
                </>
              )}

              {/* Social Activity Section - Clean and compact */}
              {drawerContact?.social_activity && (
                <SocialActivitySection social_activity={drawerContact?.social_activity} />
              )}

              {/* Social Intelligence Section */}
              {drawerContact?.ai_analysis && drawerContact.ai_analysis.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <SocialIntelligenceSection aiAnalysis={drawerContact.ai_analysis} />
                </>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

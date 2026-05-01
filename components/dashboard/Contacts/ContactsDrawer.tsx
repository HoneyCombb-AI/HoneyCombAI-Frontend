"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Send } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import axios from "axios"
import { toast } from "sonner"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DashboardContact, DrawerContact } from "@/types/contacts"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { WhyReachOutStandalone, SocialActivitySection, SocialIntelligenceSection } from "./ContactDrawerComponents"
import { ContactPersonalInfoSection } from "./ContactPersonalInfoSection"
import { IntentSignalsSection } from "./IntentSignalsSection"
import CompleteProfileSkeleton from "./ContactsDrawerSkeleton"



interface DrawerDemoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  selectedContact: DashboardContact;
}
const customDrawerStyles = {
  width: '65vw',
  maxWidth: '70vw'
};

export function ContactsDrawer({ open, onOpenChange, trigger, selectedContact }: DrawerDemoProps) {
  const router = useRouter()
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
  const optimizedProfilePicture = selectedContact.profile_picture;

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent style={customDrawerStyles}>

        <div className="mx-auto w-full h-screen overflow-y-auto">
          <DrawerHeader className="sticky top-0 bg-white z-60 border-b">
            <DrawerTitle>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative">
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
                      <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600
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
                          className={`w-1.5 h-1.5 rounded-full ${drawerContact.temperature === 'hot'
                            ? 'bg-red-500'
                            : drawerContact.temperature === 'warm'
                              ? 'bg-orange-400'
                              : 'bg-blue-400'
                            }`}
                        />
                        {/* <span className="text-xs text-gray-600 font-medium">
                          {drawerContact.temperature.charAt(0).toUpperCase() + drawerContact.temperature.slice(1)}
                        </span> */}
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
                  </div>
                )}
              </div>
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              <div className="flex w-full justify-between items-center">
                <div className="flex items-end">
                  <div
                    className="text-md font-semibold text-gray-600 line-clamp-2 max-w-[60%]"
                    title={selectedContact.title || "No title"}
                  >
                    {selectedContact.title || ""}
                  </div>
                  {selectedContact.company?.name && (
                    <>
                      <div className="text-sm text-gray-500">
                        &nbsp;at&nbsp;{selectedContact.company.name}
                      </div>
                    </>
                  )}
                </div>
                {/* Send Email Button */}
                {((drawerContact?.emails?.length ?? 0) > 0 || drawerContact?.email) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-sm shrink-0"
                    onClick={() => {
                      router.push(`/emails?contactId=${selectedContact.id}`);
                      onOpenChange(false);
                    }}
                  >
                    <Send className="h-3 w-3" />
                    Send Email
                  </Button>
                )}
              </div>
            </div>
          </DrawerHeader>
          {loading ? (
            <CompleteProfileSkeleton />

          ) : (
            <div className="px-6 py-2 space-y-3">
              {/* Intent Signals - PRIMARY FOCUS */}
              {drawerContact?.signals && drawerContact.signals.length > 0 && (
                <>
                  <IntentSignalsSection signals={drawerContact.signals} />
                  <Separator className="my-4" />
                </>
              )}

              {drawerContact && (
                <ContactPersonalInfoSection
                  contact={drawerContact}
                  companyIndustry={selectedContact.company?.industry}
                  onUpdate={() => fetchContactDetails(selectedContact.id)}
                />
              )}
              {/* Why Reach Out Section - Standalone */}
              {drawerContact?.ai_analysis?.[0] && (
                <>
                  <WhyReachOutStandalone analysis={drawerContact.ai_analysis[0]} />
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
                  <SocialIntelligenceSection
                    aiAnalysis={drawerContact.ai_analysis}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

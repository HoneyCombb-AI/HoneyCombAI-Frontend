"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { MapPin, Flag, LinkedinIcon, Globe, ExternalLink, Building, Clock, Users, Calendar } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { parseISO, format } from "date-fns"
import Image from "next/image"
import axios from "axios"
import { toast } from "sonner"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DashboardCompany, DrawerCompany } from "@/types/companies"
import { Badge } from "@/components/ui/badge"
import CompleteCompanySkeleton from "./CompanyDrawerSkeleton"

interface CompaniesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  selectedCompany: DashboardCompany;
}

const customDrawerStyles = {
  width: '46vw',
  maxWidth: '55vw'
};

const formatEmployeeCount = (count: number | null) => {
  if (!count) return "Unknown";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k employees`;
  return `${count} employees`;
};

export function CompaniesDrawer({ open, onOpenChange, trigger, selectedCompany }: CompaniesDrawerProps) {
  const [drawerCompany, setDrawerCompany] = useState<DrawerCompany | null>(null)
  const [loading, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)

  // Fetch detailed company data when drawer opens
  useEffect(() => {
    if (open && selectedCompany?.id) {
      fetchCompanyDetails(selectedCompany.id)
    }
  }, [open, selectedCompany?.id])

  const fetchCompanyDetails = async (companyId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`/api/companies/${companyId}`)
      console.log("Company Data", response.data)
      setDrawerCompany(response.data.company)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status
        if (status === 429) {
          toast.error("Too many requests. Please wait a moment before trying again.")
        } else if (status === 404) {
          toast.error("Company not found.")
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.")
        } else {
          toast.error(`Failed to fetch company details: ${err.response.statusText || 'Unknown error'}`)
        }
        setError(err.response.data?.message || err.message)
      } else if (axios.isAxiosError(err)) {
        toast.error("Network error. Please check your connection.")
        setError(err.message)
      } else {
        toast.error("An unexpected error occurred while loading company details.")
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      }
      setDrawerCompany(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent style={customDrawerStyles}>
        <div className="mx-auto w-full h-screen overflow-y-auto overflow-x-hidden">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
            <DrawerTitle>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative">
                  {selectedCompany.logo_url ? (
                    <Image
                      src={selectedCompany.logo_url}
                      alt={selectedCompany.name}
                      fill
                      sizes="px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 
                    flex items-center justify-center text-white text-sm font-medium">
                      {selectedCompany.name.charAt(0)}
                    </div>
                  )}
                  <div
                    className={`w-full h-full bg-linear-to-br from-blue-500 to-purple-600 
                    flex items-center justify-center text-white text-sm font-medium ${selectedCompany.logo_url ? 'hidden' : ''}`}
                  >
                    {selectedCompany.name.charAt(0)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-medium text-gray-900 truncate">
                    {selectedCompany.name || "Unknown"}
                  </div>
                </div>
              </div>
            </DrawerTitle>
            <div className="text-muted-foreground text-sm">
              <div className="flex w-full justify-between items-center">
                <div
                  className="text-md font-semibold text-gray-600"
                  title={selectedCompany.industry || "No industry"}
                >
                  {selectedCompany.industry || "Industry not specified"}
                </div>
                <div className="flex items-center gap-2">
                  {drawerCompany?.company_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(drawerCompany.company_url!, '_blank')}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DrawerHeader>

          {loading ? (
            <CompleteCompanySkeleton />
          ) : (
            <div className="px-6 py-2 space-y-3">
              {/* Company Signals/Nudges */}
              {drawerCompany?.nudges && drawerCompany.nudges.length > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600">Company Signals</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {drawerCompany.nudges.slice(0, 6).map((nudge, idx) => (
                        <Badge
                          key={idx}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200 border cursor-help"
                          title={nudge.description}
                        >
                          {nudge.intent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              <div className="flex gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-600">Company Information</h3>
                  </div>

                  {/* Two-column layout for company information */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Column 1: Basic company info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{drawerCompany?.city || drawerCompany?.country || "Location not specified"}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Flag className="h-4 w-4" />
                        <span>{drawerCompany?.country || "Country not specified"}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{formatEmployeeCount(drawerCompany?.estimated_num_employees ?? null)}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{drawerCompany?.contact_count} contacts in database</span>
                      </div>

                      {drawerCompany?.linkedin_url && (
                        <div className="flex items-center gap-3 text-sm">
                          <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
                          <a
                            href={drawerCompany.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn Page
                          </a>
                        </div>
                      )}

                      {drawerCompany?.company_url && (
                        <div className="flex items-center gap-3 text-sm">
                          <Globe className="h-4 w-4 text-green-600" />
                          <a
                            href={drawerCompany.company_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Company Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Industry, founding info, and keywords */}
                    <div className="space-y-4">
                      {drawerCompany?.industry && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Building className="h-4 w-6" />
                          <span>Industry: {drawerCompany.industry}</span>
                        </div>
                      )}

                      {drawerCompany?.founded_year && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Calendar className="h-4 w-5" />
                          <span>Founded in {drawerCompany.founded_year}</span>
                        </div>
                      )}

                      {drawerCompany?.created_at && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Clock className="h-4 w-5" />
                          <span>Added on {drawerCompany.created_at
                            ? format(parseISO(drawerCompany.created_at), "PPP")
                            : "—"
                          }</span>
                        </div>
                      )}

                      {/* Keywords/Tags */}
                      {drawerCompany?.keywords && drawerCompany.keywords.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-600">
                            Keywords
                          </h4>
                          <div className="flex flex-wrap gap-1 max-w-full">
                            {drawerCompany.keywords.slice(0, 8).map((keyword, idx) => (
                              <Badge key={idx} className="text-xs max-w-full truncate" variant="outline" title={keyword}>
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Description */}
                  {drawerCompany?.short_description && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-600">Description</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {drawerCompany.short_description}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Technology Stack */}
                  {drawerCompany?.technology_names && drawerCompany.technology_names.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-600">Technology Stack</h4>
                        <div className="flex flex-wrap gap-1">
                          {drawerCompany.technology_names.map((tech, idx) => (
                            <Badge key={idx} className="text-xs" variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* News Data Section */}
              {drawerCompany?.news_data && drawerCompany.news_data.length > 0 && (
                <div className="mb-3">
                  <Separator className="my-5" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-600">Recent News</h3>
                    <Badge variant="outline" className="text-xs">
                      {drawerCompany.news_data.length} Articles
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {drawerCompany.news_data.slice(0, 6).map((news, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded text-sm space-y-2">
                        {/* Header with title and external link */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                            {news.title}
                          </h4>
                          {news.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(news.link, '_blank')}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-900 shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Date and source */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {news.date ? format(parseISO(news.date), "MMM dd, yyyy") : "Date unknown"}
                          </span>
                          {news.link && (
                            <span>
                              {new URL(news.link).hostname}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
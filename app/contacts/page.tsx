"use client";
import axios from "axios";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  ChevronDown,
  Plus,
  Search,
  MapPin,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  X,
  Rows2,
  FileUp,
  Download,
  Trash2,
  Tag,
} from "lucide-react";
import ContactsSection from "@/components/dashboard/Contacts/ContactsSection";
import type {
  CompanyGroupResponse,
  LocationGroupResponse,
  SearchResponse,
  TagGroupResponse,
  PaginationInfo,
} from "@/app/api/contacts/route";
import { AddContactDrawer } from "@/components/dashboard/Contacts/AddContactDrawer";
import { ImportContactsDrawer } from "@/components/dashboard/Contacts/ImportContactsDrawer";
import { OutreachDrawer } from "@/components/dashboard/Contacts/OutreachDrawer";
import { TagsDrawer } from "@/components/dashboard/TagsDrawer";
import { SAMPLE_CONTACT_DATA } from "@/lib/joyride/sampleData";
import { useTour } from "@/lib/joyride/useTour";

// Component that uses useSearchParams wrapped in Suspense
function TourProvider({ children }: { children: (props: { isJoyrideMode: boolean }) => React.ReactNode }) {
  const { isJoyrideMode } = useTour('contacts');
  return <>{children({ isJoyrideMode })}</>;
}

export type GroupByType = "none" | "company" | "location" | "city" | "tags";
export type LocationType = "country" | "state" | "city";
export type SortBy = "name";
export type SortOrder = "asc" | "desc";

interface ContactValidationData {
  isTracked: boolean;
  primaryAnalysisCompleted: boolean;
  primaryAnalysisRequested: boolean;
  full_name: string;
  company_id: string | null;
}

export type DashboardResponse =
  | CompanyGroupResponse
  | LocationGroupResponse
  | SearchResponse
  | TagGroupResponse;

// State interface for managing dashboard data
interface DashboardState {
  data: DashboardResponse | null;
  pagination: PaginationInfo;
}

// Search and filter parameters
interface FetchParams {
  groupBy?: GroupByType;
  locationType?: LocationType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

function AudiencePageContent({ isJoyrideMode }: { isJoyrideMode: boolean }) {
  const { loading: authLoading } = useAuth();
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    data: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  });
  const [groupBy, setGroupBy] = useState<GroupByType>("none");
  const [fetchLoading, setfetchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<LocationType>("country");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>(""); // New state for input
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit, setPageLimit] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedContacts, setSelectedContacts] = useState<Map<string, ContactValidationData>>(
    new Map()
  );
  const [addContactDrawerOpen, setAddContactDrawerOpen] = useState(false);
  const [importContactsDrawerOpen, setImportContactsDrawerOpen] = useState(false);
  const [outreachDrawerOpen, setOutreachDrawerOpen] = useState(false);
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [enrichmentLoading, setEnrichmentLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const displayData = isJoyrideMode ? SAMPLE_CONTACT_DATA : dashboardState.data;

  // Fetch records from API
  const fetchDashboardData = useCallback(
    async (params?: FetchParams) => {
      try {
        setfetchLoading(true);

        const queryParams = new URLSearchParams();
        if (params?.groupBy || groupBy) {
          queryParams.append("groupBy", params?.groupBy || groupBy);
        }
        if (
          (params?.groupBy || groupBy) === "location" &&
          (params?.locationType || locationType)
        ) {
          queryParams.append(
            "locationType",
            params?.locationType || locationType
          );
        }
        if (params?.search || searchTerm) {
          queryParams.append("search", params?.search || searchTerm);
        }
        if (params?.page || currentPage) {
          queryParams.append("page", String(params?.page || currentPage));
        }
        if (params?.limit || pageLimit) {
          queryParams.append("limit", String(params?.limit || pageLimit));
        }
        if (params?.sortBy || sortBy) {
          queryParams.append("sortBy", params?.sortBy || sortBy);
        }
        if (params?.sortOrder || sortOrder) {
          queryParams.append("sortOrder", params?.sortOrder || sortOrder);
        }
        const response = await axios.get(
          `/api/contacts?${queryParams.toString()}`
        );
        console.log("API Response:", response.data);

        setDashboardState({
          data: response.data,
          pagination: response.data.pagination,
        });
        setfetchLoading(false);
      } catch (error) {
        console.error("Failed to fetch Contacts data:", error);
        setDashboardState((prev) => ({
          ...prev,
        }));
        setfetchLoading(false);
        setError(
          error instanceof Error ? error.message : "Failed to fetch data"
        );
      } finally {
        setfetchLoading(false);
        setError(null);
      }
    },
    [
      groupBy,
      locationType,
      searchTerm,
      currentPage,
      pageLimit,
      sortBy,
      sortOrder,
    ]
  );

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  // Handler functions
  const handleGroupByChange = (newGroupBy: GroupByType) => {
    setGroupBy(newGroupBy);
    setCurrentPage(1);
    setSortOrder("asc");
  };

  const handleLocationTypeChange = (newLocationType: LocationType) => {
    setLocationType(newLocationType);
    setCurrentPage(1);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setGroupBy("none");
    setLocationType("country");
    setSearchTerm("");
    setSearchInput("");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
    setSelectedContacts(new Map());
  };

  // Optimized contact states calculation using useMemo
  const contactStates = useMemo(() => {
    const selectedContactsArray = Array.from(selectedContacts.entries());

    const states = selectedContactsArray.reduce((acc, [, data]) => {
      acc.total++;
      // Tracking eligibility is now based on having a company
      if (data.company_id) {
        acc.eligibleForTracking++;
        if (data.isTracked) acc.tracked++;
        else acc.untracked++;

        // Track unique companies for display
        if (!acc.uniqueCompanies.has(data.company_id)) {
          acc.uniqueCompanies.set(data.company_id, data.isTracked);
        }
      } else {
        acc.ineligibleForTracking++;
      }
      if (!data.primaryAnalysisCompleted && !data.primaryAnalysisRequested) acc.eligibleForEnrichment++;
      else acc.ineligibleForEnrichment++;
      return acc;
    }, {
      total: 0,
      tracked: 0,
      untracked: 0,
      eligibleForTracking: 0,
      ineligibleForTracking: 0,
      eligibleForEnrichment: 0,
      ineligibleForEnrichment: 0,
      uniqueCompanies: new Map<string, boolean>()
    });

    // Calculate company-level tracking counts
    const companyStates = Array.from(states.uniqueCompanies.values());
    const trackedCompanies = companyStates.filter(isTracked => isTracked).length;
    const untrackedCompanies = companyStates.filter(isTracked => !isTracked).length;

    return {
      totalSelected: states.total,
      trackedCount: states.tracked,
      untrackedCount: states.untracked,
      eligibleForTrackingCount: states.eligibleForTracking,
      ineligibleForTrackingCount: states.ineligibleForTracking,
      uniqueCompanyCount: states.uniqueCompanies.size,
      trackedCompanyCount: trackedCompanies,
      untrackedCompanyCount: untrackedCompanies,
      hasTracked: states.tracked > 0,
      hasUntracked: states.untracked > 0,
      hasEligibleForTracking: states.eligibleForTracking > 0,
      allTracked: states.eligibleForTracking > 0 && states.tracked === states.eligibleForTracking,
      allUntracked: states.eligibleForTracking > 0 && states.untracked === states.eligibleForTracking,
      trackingIsMixed: states.tracked > 0 && states.untracked > 0,
      eligibleCount: states.eligibleForEnrichment,
      ineligibleCount: states.ineligibleForEnrichment,
      hasEligible: states.eligibleForEnrichment > 0,
      hasIneligible: states.ineligibleForEnrichment > 0,
      allEligible: states.total > 0 && states.eligibleForEnrichment === states.total,
      allIneligible: states.total > 0 && states.ineligibleForEnrichment === states.total,
      enrichmentIsMixed: states.eligibleForEnrichment > 0 && states.ineligibleForEnrichment > 0
    };
  }, [selectedContacts]);

  const getTrackingButtonText = () => {
    if (contactStates.totalSelected === 0) return "Contact Tracking";
    if (!contactStates.hasEligibleForTracking) {
      return `Contact Tracking (${contactStates.ineligibleForTrackingCount} without company)`;
    }

    const companyText = contactStates.uniqueCompanyCount === 1 ? "company" : "companies";

    if (contactStates.allTracked) {
      return `Disable Tracking (${contactStates.trackedCompanyCount} ${companyText})`;
    } else if (contactStates.allUntracked) {
      return `Enable Tracking (${contactStates.untrackedCompanyCount} ${companyText})`;
    } else if (contactStates.trackingIsMixed) {
      return `Toggle Tracking (${contactStates.untrackedCompanyCount} enable, ${contactStates.trackedCompanyCount} disable)`;
    }

    return "Contact Tracking";
  };

  const getEnrichmentButtonText = () => {
    if (contactStates.totalSelected === 0) return "Complete Contact Enrichment";

    if (contactStates.hasEligible) {
      if (contactStates.enrichmentIsMixed) {
        return `Complete Contact Enrichment (${contactStates.eligibleCount} eligible)`;
      } else {
        return `Complete Contact Enrichment (${contactStates.eligibleCount})`;
      }
    }
    return "Complete Contact Enrichment";
  };

  const getOutreachButtonText = () => {
    if (contactStates.totalSelected === 0) return "Generate Outreach";
    if (!contactStates.hasEligibleForTracking) {
      return `Generate Outreach (${contactStates.ineligibleForTrackingCount} ineligible)`;
    }
    return `Generate Outreach (${contactStates.eligibleForTrackingCount})`;
  };

  // Contact selection handlers
  const handleContactSelect = (contactId: string, contactData: ContactValidationData) => {
    setSelectedContacts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(contactId)) {
        newMap.delete(contactId);
      } else {
        newMap.set(contactId, contactData);
      }
      return newMap;
    });
  };

  const handleSelectAll = (contactsData: Array<{ id: string, data: ContactValidationData }>) => {
    setSelectedContacts((prev) => {
      const newMap = new Map(prev);
      const contactIds = contactsData.map(contact => contact.id);
      const allSelected = contactIds.every((id) => newMap.has(id));

      if (allSelected) {
        // Deselect all
        contactIds.forEach((id) => newMap.delete(id));
      } else {
        // Select all
        contactsData.forEach(({ id, data }) => newMap.set(id, data));
      }
      return newMap;
    });
  };

  const handleEnrichmentAction = async (
    type: "complete_contact_workflow" | "outreach_enrichment"
  ) => {
    if (selectedContacts.size === 0) {
      toast.error("No contacts selected for enrichment");
      return;
    }

    // Get eligible contact IDs based on action type
    const selectedContactsArray = Array.from(selectedContacts.entries());
    let eligibleContactIds: string[];

    if (type === "outreach_enrichment") {
      // For outreach generation, only contacts with completed primary analysis
      eligibleContactIds = selectedContactsArray
        .filter(([, data]) => data.primaryAnalysisCompleted)
        .map(([id]) => id);

      if (eligibleContactIds.length === 0) {
        toast.error("No eligible contacts selected for outreach generation");
        return;
      }

      // Open the outreach drawer instead of directly calling the API
      setOutreachDrawerOpen(true);
      return;
    } else {
      // For complete contact workflow, contacts without completed/requested primary analysis
      eligibleContactIds = selectedContactsArray
        .filter(([, data]) => !data.primaryAnalysisCompleted && !data.primaryAnalysisRequested)
        .map(([id]) => id);

      if (eligibleContactIds.length === 0) {
        toast.error("No eligible contacts selected for enrichment");
        return;
      }
    }

    try {
      setEnrichmentLoading(true);

      const response = await axios.post("/api/contacts/enrichment", {
        entity_ids: eligibleContactIds,
        entity_type: "contact_id",
        task_type: type
      });

      if (response.data.success) {
        toast.success(`${response.data.message}${response.data.tokens_used ? `. This will consume ${response.data.tokens_used} tokens upon completion` : ""}`);
        setSelectedContacts(new Map());

        if (response.data.request_id) {
          const requestData = {
            request_id: response.data.request_id,
            timestamp: new Date().toISOString(),
            task_type: type,
            contact_count: eligibleContactIds.length,
            tokens_allocated: response.data.tokens_used || 0
          };
          const existingRequests = JSON.parse(localStorage.getItem('enrichmentRequests') || '[]');
          existingRequests.push(requestData);

          localStorage.setItem('enrichmentRequests', JSON.stringify(existingRequests));
          fetchDashboardData()
        }
      } else {
        toast.error(response.data.message || "Enrichment request failed");
      }
    } catch (error) {
      console.error("Enrichment request failed:", error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: { message?: string }) => {
            toast.error(err.message || "Unknown error occurred");
          });
        } else {
          toast.error(errorData.message || "Enrichment request failed");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setEnrichmentLoading(false);
    }
  };

  const handleTrackingToggle = async () => {
    if (selectedContacts.size === 0) {
      toast.error("No contacts selected for tracking");
      return;
    }

    const selectedContactsArray = Array.from(selectedContacts.entries());

    // Extract unique company IDs from selected contacts
    const uniqueCompanyIds = new Set<string>();
    selectedContactsArray.forEach(([, data]) => {
      if (data.company_id) {
        uniqueCompanyIds.add(data.company_id);
      }
    });

    if (uniqueCompanyIds.size === 0) {
      toast.error("Selected contacts do not have companies. Only contacts with companies can be tracked.");
      return;
    }

    try {
      setEnrichmentLoading(true);
      const response = await axios.post("/api/contacts/tracking", {
        company_ids: Array.from(uniqueCompanyIds),
        action: contactStates.trackingIsMixed ? "toggle" : (contactStates.allTracked ? "disable" : "enable")
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchDashboardData();
        setSelectedContacts(new Map());
      } else {
        toast.error(response.data.message || "Tracking update failed");
      }
    } catch (error) {
      console.error("Tracking update failed:", error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        toast.error(errorData.message || "Tracking update failed");
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setEnrichmentLoading(false);
    }
  };

  const handleExportToCSV = async () => {
    if (selectedContacts.size === 0) {
      toast.error("No contacts selected for export");
      return;
    }

    const selectedContactIds = Array.from(selectedContacts.keys());

    try {
      setExportLoading(true);

      const response = await axios.post('/api/csv-export', {
        type: 'contacts',
        ids: selectedContactIds
      }, {
        responseType: 'blob'
      });

      // Get the filename from the response headers
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${selectedContactIds.length} contacts successfully`);

    } catch (error) {
      console.error('Export failed:', error);

      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;

        if (status === 429) {
          toast.error("Rate limit exceeded. Please wait before exporting more data.");
        } else if (status === 401) {
          toast.error("Unauthorized. Please log in again.");
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Export failed. Please try again.");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteContacts = async () => {
    if (selectedContacts.size === 0) {
      toast.error("No contacts selected for deletion");
      return;
    }

    const selectedContactsArray = Array.from(selectedContacts.entries());
    const selectedContactIds = selectedContactsArray.map(([id]) => id);

    // Check for in-progress contacts
    const inProgressContacts = selectedContactsArray.filter(
      ([, data]) => data.primaryAnalysisRequested && !data.primaryAnalysisCompleted
    );
    const deletableContacts = selectedContactsArray.filter(
      ([, data]) => !data.primaryAnalysisRequested || data.primaryAnalysisCompleted
    );

    // Build confirmation message
    let confirmMessage = '';
    if (inProgressContacts.length > 0 && deletableContacts.length > 0) {
      confirmMessage = `You have selected ${selectedContactIds.length} contact(s).\n\n` +
        `${deletableContacts.length} contact(s) will be deleted.\n` +
        `${inProgressContacts.length} contact(s) are in-progress and cannot be deleted.\n\n` +
        `Do you want to proceed with deleting ${deletableContacts.length} contact(s)? This action cannot be undone.`;
    } else if (inProgressContacts.length > 0 && deletableContacts.length === 0) {
      toast.error(`All selected contacts are in-progress and cannot be deleted.`);
      return;
    } else {
      confirmMessage = `Are you sure you want to delete ${deletableContacts.length} contact(s)? This action cannot be undone.`;
    }

    // Confirm deletion
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setEnrichmentLoading(true);

      const response = await axios.post('/api/contacts/delete', {
        contact_ids: selectedContactIds
      });

      if (response.data.success) {
        const { deleted_count, skipped_count } = response.data;

        if (deleted_count > 0 && skipped_count > 0) {
          toast.success(
            `Deleted ${deleted_count} contact(s). ${skipped_count} contact(s) are in-progress and were skipped.`
          );
        } else if (deleted_count > 0) {
          toast.success(`Successfully deleted ${deleted_count} contact(s)`);
        } else if (skipped_count > 0) {
          toast.error(`${skipped_count} contact(s) are in-progress and cannot be deleted.`);
        }

        setSelectedContacts(new Map());
        fetchDashboardData();
      } else {
        toast.error(response.data.message || "Failed to delete contacts");
      }
    } catch (error) {
      console.error('Delete failed:', error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        toast.error(errorData.message || "Failed to delete contacts");
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setEnrichmentLoading(false);
    }
  };

  // Check if any filters are applied
  const hasFiltersApplied = () => {
    return (
      groupBy !== "none" ||
      locationType !== "country" ||
      searchTerm !== "" ||
      sortBy !== "name" ||
      sortOrder !== "asc"
    );
  };
  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col p-6">
        <Alert>
          <AlertDescription>Failed to load data: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      {/* Enhanced Actions Bar */}
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 transition-all duration-300">
          {/* Browse Mode Controls - Hidden when contacts are selected */}
          {selectedContacts.size === 0 && (
            <>
              {/* Group Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild data-testid="group-dropdown">
                  <Button variant="outline" size="sm" className="gap-2 text-sm">
                    {groupBy === "tags" ? (
                      <Tag className="h-4 w-4" />
                    ) : groupBy === "location" ? (
                      <MapPin className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Group:</span>
                    <span>
                      {groupBy === "none" ? "None" : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleGroupByChange("none")}>
                    <Building2 className="h-4 w-4 mr-2" />
                    None
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleGroupByChange("company")}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Company
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleGroupByChange("location")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleGroupByChange("tags")}>
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Location Type Filter - only show when groupBy is location */}
              {groupBy === "location" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Location:</span>
                      <span>
                        {locationType.charAt(0).toUpperCase() +
                          locationType.slice(1)}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => handleLocationTypeChange("country")}
                    >
                      Country
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleLocationTypeChange("state")}
                    >
                      State
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleLocationTypeChange("city")}
                    >
                      City
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Sort Controls - Fixed to Name only with sort order toggle */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm"
                onClick={handleSortOrderToggle}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Sort:</span>
                <span>Name</span>
              </Button>

              {/* Search Input with Button */}
              <div className="relative">
                <Search
                  onClick={handleSearchSubmit}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:cursor-pointer hover:bg-black"
                />
                <Input
                  placeholder="Search contacts..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="pl-10 w-64"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchSubmit();
                    }
                  }}
                />
              </div>
              {/* Clear All Filters - only show when filters are applied */}
              {hasFiltersApplied() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="gap-2 text-gray-500"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Browse Mode Controls - Hidden when contacts are selected */}
          {selectedContacts.size === 0 && (
            <>
              {/* Page Size Control */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-sm h-9">
                    <span>Show {pageLimit}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleLimitChange(10)}>
                    10 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLimitChange(20)}>
                    20 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLimitChange(50)}>
                    50 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLimitChange(100)}>
                    100 per page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild data-testid="insert-dropdown">
                  <Button size="sm" className="gap-2 text-sm h-9">
                    <ChevronDown className="h-3 w-3" />
                    <span className="hidden sm:inline">Insert</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setAddContactDrawerOpen(true)}>
                    <Rows2 className="h-4 w-4" />
                    <span>Add Contact</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setImportContactsDrawerOpen(true)}>
                    <FileUp className="h-4 w-4 mr-2" />
                    <span>Import data from CSV</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Action Mode Controls - Shown only when contacts are selected */}
          {selectedContacts.size > 0 && (
            <>
              {/* Manage Tags Button */}
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-sm h-9"
                onClick={() => setTagsDrawerOpen(true)}
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Manage Tags</span>
                <span className="sm:hidden">Tags</span>
              </Button>

              {/* Export to CSV Button */}
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-sm h-9"
                disabled={exportLoading}
                onClick={handleExportToCSV}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {exportLoading ? "Exporting..." : "Export to CSV"}
                </span>
                <span className="sm:hidden">
                  {exportLoading ? "Exporting..." : "Export"}
                </span>
              </Button>

              {/* Add Enrichment Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild >
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 font-medium h-9"
                    disabled={enrichmentLoading}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {enrichmentLoading ? "Processing..." : "Add enrichment"}
                    </span>
                    <span className="sm:hidden">
                      {enrichmentLoading ? "Processing..." : "Enrich"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {contactStates.hasEligible && (
                    <DropdownMenuItem
                      onSelect={() => handleEnrichmentAction("complete_contact_workflow")}
                    >
                      {getEnrichmentButtonText()}
                    </DropdownMenuItem>
                  )}
                  {contactStates.hasEligibleForTracking && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => handleEnrichmentAction("outreach_enrichment")}
                      >
                        {getOutreachButtonText()}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleTrackingToggle()}
                      >
                        {getTrackingButtonText()}
                      </DropdownMenuItem>
                    </>
                  )}
                  {!contactStates.hasEligibleForTracking && selectedContacts.size > 0 && (
                    <>
                      <DropdownMenuItem disabled>
                        {getOutreachButtonText()}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        {getTrackingButtonText()}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete Button */}
              <Button
                size="sm"
                variant="destructive"
                className="gap-2 text-sm h-9"
                disabled={enrichmentLoading}
                onClick={handleDeleteContacts}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Delete ({selectedContacts.size})
                </span>
                <span className="sm:hidden">
                  Delete
                </span>
              </Button>

              {/* Clear Selection Button */}
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-sm h-9"
                onClick={() => setSelectedContacts(new Map())}
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Clear Selection</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </>
          )}

          {/* Add Contact Drawer */}
          <AddContactDrawer
            open={addContactDrawerOpen}
            onOpenChange={setAddContactDrawerOpen}
            onSubmit={() => fetchDashboardData()}
          />

          {/* Import Contacts Drawer */}
          <ImportContactsDrawer
            open={importContactsDrawerOpen}
            onOpenChange={setImportContactsDrawerOpen}
            onSubmit={() => fetchDashboardData()}
          />

          {/* Outreach Drawer */}
          <OutreachDrawer
            open={outreachDrawerOpen}
            onOpenChange={setOutreachDrawerOpen}
            selectedContacts={selectedContacts}
            onSubmit={() => fetchDashboardData()}
          />

          {/* Tags Drawer */}
          <TagsDrawer
            open={tagsDrawerOpen}
            onOpenChange={setTagsDrawerOpen}
            selectedItems={Array.from(selectedContacts.keys())}
            taggableType="contact"
            onTagsUpdated={() => fetchDashboardData()}
          />
        </div>
      </div>

      {/* Main Content */}
      {authLoading || fetchLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
          <Loading />
          <p className="text-sm text-muted-foreground mt-4">Loading your contacts...</p>
        </div>
      ) : (
        <div className="min-h-[400px] bg-white shadow-sm p-6">
          <ContactsSection
            groupBy={groupBy}
            records={displayData as DashboardResponse}
            selectedContacts={selectedContacts}
            onContactSelect={handleContactSelect}
            onSelectAll={handleSelectAll}
          />
        </div>
      )}

      {/* Pagination Controls - Footer Style */}
      {dashboardState.pagination &&
        dashboardState.pagination.totalPages > 1 && (
          <footer className="border-t bg-white px-6 py-4 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                {(dashboardState.pagination.page - 1) *
                  dashboardState.pagination.limit +
                  1}{" "}
                to{" "}
                {Math.min(
                  dashboardState.pagination.page *
                  dashboardState.pagination.limit,
                  dashboardState.pagination.total
                )}{" "}
                of {dashboardState.pagination.total} results
              </div>

              <div className="flex items-center gap-2">
                {dashboardState.pagination.hasPrev && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                )}
                <div className="flex items-center gap-1">
                  {Array.from(
                    {
                      length: Math.min(5, dashboardState.pagination.totalPages),
                    },
                    (_, i) => {
                      const pageNum =
                        Math.max(
                          1,
                          Math.min(
                            dashboardState.pagination.totalPages - 4,
                            Math.max(1, currentPage - 2)
                          )
                        ) + i;

                      if (pageNum <= dashboardState.pagination.totalPages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pageNum === currentPage ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
                {dashboardState.pagination.hasNext && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Page {dashboardState.pagination.page} of{" "}
                {dashboardState.pagination.totalPages}
              </div>
            </div>
          </footer>
        )}
    </div>
  );
}

export default function AudiencePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-sm text-muted-foreground mt-4">Loading your contacts...</p>
      </div>
    }>
      <TourProvider>
        {({ isJoyrideMode }) => <AudiencePageContent isJoyrideMode={isJoyrideMode} />}
      </TourProvider>
    </Suspense>
  );
}

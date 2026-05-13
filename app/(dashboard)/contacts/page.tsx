"use client";
import axios from "axios";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Rows2,
  FileUp,
  Download,
  Trash2,
  Tag,
  Mail,
  Check,
} from "lucide-react";
import ContactsSection from "@/components/dashboard/Contacts/ContactsSection";
import type {
  CompanyGroupResponse,
  LocationGroupResponse,
  SearchResponse,
  TagGroupResponse,
  PaginationInfo,
  MinimalCompany,
} from "@/types/contacts";
import { AddContactDrawer } from "@/components/dashboard/Contacts/AddContactDrawer";
import { ImportContactsDrawer } from "@/components/dashboard/Contacts/ImportContactsDrawer";
import { TagsDrawer } from "@/components/dashboard/TagsDrawer";
import { SAMPLE_CONTACT_DATA } from "@/lib/joyride/sampleData";
import { useTour } from "@/lib/joyride/useTour";


// Component that uses useSearchParams wrapped in Suspense
function TourProvider({ children }: { children: (props: { isJoyrideMode: boolean }) => React.ReactNode }) {
  const { isJoyrideMode } = useTour('contacts');
  return <>{children({ isJoyrideMode })}</>;
}

export type GroupByType = "none" | "company" | "location" | "city" | "tags";
export type LocationType = "country" | "city";
export type SortBy = "name";
export type SortOrder = "asc" | "desc";

interface ContactValidationData {
  primaryAnalysisCompleted: boolean;
  primaryAnalysisRequested: boolean;
  full_name: string;
  company_id: string | null;
  email: string | null;
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
  const router = useRouter();
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
  const [searchInput, setSearchInput] = useState<string>("");
  const [selectedFilterCompanyId, setSelectedFilterCompanyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit, setPageLimit] = useState<number>(20);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedContacts, setSelectedContacts] = useState<Map<string, ContactValidationData>>(
    new Map()
  );
  const [addContactDrawerOpen, setAddContactDrawerOpen] = useState(false);
  const [importContactsDrawerOpen, setImportContactsDrawerOpen] = useState(false);
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const displayData = isJoyrideMode ? SAMPLE_CONTACT_DATA : dashboardState.data;

  // Fetch records from API
  const fetchDashboardData = useCallback(
    async (params?: FetchParams, bypassCache = false) => {
      setfetchLoading(true);
      setError(null);
      try {
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
          `/api/contacts?${queryParams.toString()}`,
          { ...(bypassCache && { headers: { 'Cache-Control': 'no-cache' } }) }
        );
        setDashboardState({
          data: response.data,
          pagination: response.data.pagination,
        });
        setSelectedFilterCompanyId(null);
      } catch (error) {
        console.error("Failed to fetch Contacts data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch data");
      } finally {
        setfetchLoading(false);
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  const availableCompanies = useMemo<MinimalCompany[]>(() => {
    if (!displayData) return [];
    return (displayData as DashboardResponse).available_companies ?? [];
  }, [displayData]);

  const clearAllFilters = () => {
    setGroupBy("none");
    setLocationType("country");
    setSearchTerm("");
    setSearchInput("");
    setSelectedFilterCompanyId(null);
    setSortBy("name");
    setSortOrder("desc");
    setCurrentPage(1);
    setSelectedContacts(new Map());
  };


  // Contact selection handlers
  const handleContactSelect = useCallback((contactId: string, contactData: ContactValidationData) => {
    setSelectedContacts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(contactId)) {
        newMap.delete(contactId);
      } else {
        newMap.set(contactId, contactData);
      }
      return newMap;
    });
  }, []);

  const handleSelectAll = useCallback((contactsData: Array<{ id: string, data: ContactValidationData }>) => {
    setSelectedContacts((prev) => {
      const newMap = new Map(prev);
      const contactIds = contactsData.map(contact => contact.id);
      const allSelected = contactIds.every((id) => newMap.has(id));

      if (allSelected) {
        contactIds.forEach((id) => newMap.delete(id));
      } else {
        contactsData.forEach(({ id, data }) => newMap.set(id, data));
      }
      return newMap;
    });
  }, []);



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
      setDeleteLoading(true);

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
        fetchDashboardData(undefined, true);
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
      setDeleteLoading(false);
    }
  };

  const hasFiltersApplied = () => {
    return (
      groupBy !== "none" ||
      locationType !== "country" ||
      searchTerm !== "" ||
      selectedFilterCompanyId !== null
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
                      onSelect={() => handleLocationTypeChange("city")}
                    >
                      City
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Company Filter - populated from loaded data */}
              {availableCompanies.length > 0 && (
                <div className={`group/company-filter flex items-center ${selectedFilterCompanyId ? "rounded-md border border-input shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]" : ""}`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`gap-2 text-sm ${selectedFilterCompanyId ? "rounded-r-none border-0 shadow-none focus-visible:ring-0 focus-visible:border-0" : ""}`}
                      >
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Company:</span>
                        <span className="max-w-[120px] truncate">
                          {selectedFilterCompanyId
                            ? (availableCompanies.find(c => c.id === selectedFilterCompanyId)?.name ?? "Company")
                            : "All"}
                        </span>
                        {!selectedFilterCompanyId && <ChevronDown className="h-3 w-3 shrink-0" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                      {availableCompanies.map((company) => (
                        <DropdownMenuItem
                          key={company.id}
                          onSelect={() => setSelectedFilterCompanyId(
                            selectedFilterCompanyId === company.id ? null : company.id
                          )}
                          className="gap-2"
                        >
                          {selectedFilterCompanyId === company.id && (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className={selectedFilterCompanyId === company.id ? "" : "pl-5"}>
                            {company.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedFilterCompanyId && (
                    <button
                      className="h-8 px-2 rounded-r-md border-l border-input hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center"
                      onClick={() => setSelectedFilterCompanyId(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Search Input */}
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

              {/* Send Email Button - Only when 1 contact with an email is selected */}
              {selectedContacts.size === 1 && (() => {
                const contactId = Array.from(selectedContacts.keys())[0];
                const contactEmail = selectedContacts.get(contactId)?.email;
                if (!contactEmail) return null;
                return (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-sm h-9"
                    onClick={() => router.push(`/emails?contactId=${contactId}`)}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Send Email</span>
                    <span className="sm:hidden">Email</span>
                  </Button>
                );
              })()}

              {/* Delete Button */}
              <Button
                size="sm"
                variant="destructive"
                className="gap-2 text-sm h-9"
                disabled={deleteLoading}
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
            onSubmit={() => fetchDashboardData(undefined, true)}
          />

          {/* Import Contacts Drawer */}
          <ImportContactsDrawer
            open={importContactsDrawerOpen}
            onOpenChange={setImportContactsDrawerOpen}
            onSubmit={() => fetchDashboardData(undefined, true)}
          />

          {/* Tags Drawer */}
          <TagsDrawer
            open={tagsDrawerOpen}
            onOpenChange={setTagsDrawerOpen}
            selectedItems={Array.from(selectedContacts.keys())}
            taggableType="contact"
            onTagsUpdated={() => fetchDashboardData(undefined, true)}
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
            filterCompanyId={selectedFilterCompanyId}
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

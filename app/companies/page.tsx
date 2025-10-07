"use client";
import axios from "axios";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  Factory,
  Users,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Trash2,
} from "lucide-react";
import CompaniesSection from "@/components/dashboard/Company/CompaniesSection";
import type {
  CompanyListResponse,
  IndustryGroupResponse,
  LocationGroupResponse,
  EmployeeSizeGroupResponse,
  SearchResponse,
  PaginationInfo,
} from "@/app/api/companies/route";
import { AddCompanyDrawer } from "@/components/dashboard/Company/AddCompanyDrawer";
import { SAMPLE_COMPANY_DATA } from "@/lib/joyride/sampleData";
import { useTour } from "@/lib/joyride/useTour";

// Component that uses useSearchParams wrapped in Suspense
function TourProvider({ children }: { children: (props: { isJoyrideMode: boolean }) => React.ReactNode }) {
  const { isJoyrideMode } = useTour('companies');
  return <>{children({ isJoyrideMode })}</>;
}

export type GroupByType = "none" | "industry" | "location" | "employee_size";
export type LocationType = "country" | "state" | "city";
export type SortBy = "name" | "created_at";
export type SortOrder = "asc" | "desc";

interface CompanyValidationData {
  company_analysis_completed: boolean;
  company_analysis_requested: boolean;
  news_requested: boolean;
  name: string;
}

export type DashboardResponse =
  | CompanyListResponse
  | IndustryGroupResponse
  | LocationGroupResponse
  | EmployeeSizeGroupResponse
  | SearchResponse;

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

function CompaniesPageContent({ isJoyrideMode }: { isJoyrideMode: boolean }) {
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
  const [selectedCompanies, setSelectedCompanies] = useState<Map<string, CompanyValidationData>>(
    new Map()
  );
  const [addCompanyDrawerOpen, setAddCompanyDrawerOpen] = useState(false);
  const [enrichmentLoading, setEnrichmentLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const displayData = isJoyrideMode ? SAMPLE_COMPANY_DATA : dashboardState.data;

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
          `/api/companies?${queryParams.toString()}`
        );
        console.log("API Response:", response.data);

        setDashboardState({
          data: response.data,
          pagination: response.data.pagination,
        });
        setfetchLoading(false);
      } catch (error) {
        console.error("Failed to fetch Companies data:", error);
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

  // Clear search functionality is handled by clearAllFilters

  const clearAllFilters = () => {
    setGroupBy("none");
    setLocationType("country");
    setSearchTerm("");
    setSearchInput("");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
    setSelectedCompanies(new Map());
  };

  // Optimized company states calculation using useMemo
  const companyStates = useMemo(() => {
    const selectedCompaniesArray = Array.from(selectedCompanies.entries());

    const states = selectedCompaniesArray.reduce((acc, [, data]) => {
      acc.total++;

      // Company enrichment eligibility states
      if (!data.company_analysis_completed && !data.company_analysis_requested) {
        acc.eligibleForCompanyEnrichment++;
      } else {
        acc.ineligibleForCompanyEnrichment++;
      }

      // News enrichment eligibility states
      if (!data.news_requested) {
        acc.eligibleForNewsEnrichment++;
      } else {
        acc.ineligibleForNewsEnrichment++;
      }

      return acc;
    }, {
      total: 0,
      eligibleForCompanyEnrichment: 0,
      ineligibleForCompanyEnrichment: 0,
      eligibleForNewsEnrichment: 0,
      ineligibleForNewsEnrichment: 0
    });

    return {
      // Basic counts
      totalSelected: states.total,

      // Company enrichment states
      eligibleCompanyEnrichmentCount: states.eligibleForCompanyEnrichment,
      ineligibleCompanyEnrichmentCount: states.ineligibleForCompanyEnrichment,
      hasEligibleForCompanyEnrichment: states.eligibleForCompanyEnrichment > 0,

      // News enrichment states
      eligibleNewsEnrichmentCount: states.eligibleForNewsEnrichment,
      ineligibleNewsEnrichmentCount: states.ineligibleForNewsEnrichment,
      hasEligibleForNewsEnrichment: states.eligibleForNewsEnrichment > 0,
    };
  }, [selectedCompanies]);

  // Company selection handlers
  const handleCompanySelect = (companyId: string, companyData: CompanyValidationData) => {
    setSelectedCompanies((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(companyId)) {
        newMap.delete(companyId);
      } else {
        newMap.set(companyId, companyData);
      }
      return newMap;
    });
  };

  const handleSelectAll = (companiesData: Array<{ id: string, data: CompanyValidationData }>) => {
    setSelectedCompanies((prev) => {
      const newMap = new Map(prev);
      const companyIds = companiesData.map(company => company.id);
      const allSelected = companyIds.every((id) => newMap.has(id));

      if (allSelected) {
        // Deselect all
        companyIds.forEach((id) => newMap.delete(id));
      } else {
        // Select all
        companiesData.forEach(({ id, data }) => newMap.set(id, data));
      }
      return newMap;
    });
  };

  const handleEnrichmentAction = async (
    type:
      | "company_enrichment"
      | "news_enrichment"
  ) => {
    if (selectedCompanies.size === 0) {
      toast.error("No companies selected for enrichment");
      return;
    }

    // Get eligible company IDs based on enrichment type
    const selectedCompaniesArray = Array.from(selectedCompanies.entries());
    let eligibleCompanyIds: string[] = [];

    if (type === "company_enrichment") {
      eligibleCompanyIds = selectedCompaniesArray
        .filter(([, data]) => !data.company_analysis_completed && !data.company_analysis_requested)
        .map(([id]) => id);
    } else if (type === "news_enrichment") {
      eligibleCompanyIds = selectedCompaniesArray
        .filter(([, data]) => !data.news_requested)
        .map(([id]) => id);
    }

    if (eligibleCompanyIds.length === 0) {
      toast.error("No eligible companies selected for enrichment");
      return;
    }

    try {
      setEnrichmentLoading(true);

      const response = await axios.post("/api/companies/enrichment", {
        entity_ids: eligibleCompanyIds,
        entity_type: "company_id",
        task_type: type
      });

      if (response.data.success) {
        toast.success(
          `${response.data.message}${response.data.tokens_used ? ` (${response.data.tokens_used} tokens used)` : ""
          }`
        );

        // Clear selected companies after successful enrichment
        setSelectedCompanies(new Map());
        fetchDashboardData()
        // Log request ID for tracking if available
        if (response.data.request_id) {
          console.log("Enrichment Request ID:", response.data.request_id);
        }
      } else {
        // Handle API success:false responses
        toast.error(response.data.message || "Enrichment request failed");
      }
    } catch (error) {
      console.error("Enrichment request failed:", error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Show specific error messages
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

  const handleExportToCSV = async () => {
    if (selectedCompanies.size === 0) {
      toast.error("No companies selected for export");
      return;
    }

    const selectedCompanyIds = Array.from(selectedCompanies.keys());

    try {
      setExportLoading(true);

      const response = await axios.post('/api/csv-export', {
        type: 'companies',
        ids: selectedCompanyIds
      }, {
        responseType: 'blob'
      });

      // Get the filename from the response headers
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `companies_export_${new Date().toISOString().split('T')[0]}.csv`;

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

      toast.success(`Exported ${selectedCompanyIds.length} companies successfully`);

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

  const handleDeleteCompanies = async () => {
    if (selectedCompanies.size === 0) {
      toast.error("No companies selected for deletion");
      return;
    }

    const selectedCompaniesArray = Array.from(selectedCompanies.entries());
    const selectedCompanyIds = selectedCompaniesArray.map(([id]) => id);

    // Check for in-progress companies
    const inProgressCompanies = selectedCompaniesArray.filter(
      ([, data]) => data.company_analysis_requested && !data.company_analysis_completed
    );
    const deletableCompanies = selectedCompaniesArray.filter(
      ([, data]) => !data.company_analysis_requested || data.company_analysis_completed
    );

    // Build confirmation message
    let confirmMessage = '';
    if (inProgressCompanies.length > 0 && deletableCompanies.length > 0) {
      confirmMessage = `You have selected ${selectedCompanyIds.length} company(s).\n\n` +
        `${deletableCompanies.length} company(s) will be deleted.\n` +
        `${inProgressCompanies.length} company(s) are in-progress and cannot be deleted.\n\n` +
        `⚠️ WARNING: Deleting companies will also delete all associated contacts.\n\n` +
        `Do you want to proceed with deleting ${deletableCompanies.length} company(s)? This action cannot be undone.`;
    } else if (inProgressCompanies.length > 0 && deletableCompanies.length === 0) {
      toast.error(`All selected companies are in-progress and cannot be deleted.`);
      return;
    } else {
      confirmMessage = `Are you sure you want to delete ${deletableCompanies.length} company(s)?\n\n` +
        `⚠️ WARNING: This will also delete all associated contacts.\n\n` +
        `This action cannot be undone.`;
    }

    // Confirm deletion
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setEnrichmentLoading(true);

      const response = await axios.post('/api/companies/delete', {
        company_ids: selectedCompanyIds
      });

      if (response.data.success) {
        const { deleted_count, skipped_count } = response.data;

        if (deleted_count > 0 && skipped_count > 0) {
          toast.success(
            `Deleted ${deleted_count} company(s). ${skipped_count} company(s) are in-progress and were skipped.`
          );
        } else if (deleted_count > 0) {
          toast.success(`Successfully deleted ${deleted_count} company(s)`);
        } else if (skipped_count > 0) {
          toast.error(`${skipped_count} company(s) are in-progress and cannot be deleted.`);
        }

        setSelectedCompanies(new Map());
        fetchDashboardData();
      } else {
        toast.error(response.data.message || "Failed to delete companies");
      }
    } catch (error) {
      console.error('Delete failed:', error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        toast.error(errorData.message || "Failed to delete companies");
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
          {/* Browse Mode Controls - Hidden when companies are selected */}
          {selectedCompanies.size === 0 && (
            <>
              {/* Group Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild data-testid="group-dropdown">
                  <Button variant="outline" size="sm" className="gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Group:</span>
                    <span>
                      {groupBy === "none"
                        ? "None"
                        : groupBy.charAt(0).toUpperCase() +
                        groupBy.slice(1).replace("_", " ")}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleGroupByChange("none")}>
                    <Building2 className="h-4 w-4 mr-2" />
                    None
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleGroupByChange("industry")}
                  >
                    <Factory className="h-4 w-4 mr-2" />
                    Industry
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleGroupByChange("location")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => handleGroupByChange("employee_size")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Employee Size
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
                  placeholder="Search companies..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="pl-10 w-64"
                  data-testid="search-input"
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
          {/* Browse Mode Controls - Hidden when companies are selected */}
          {selectedCompanies.size === 0 && (
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
                <DropdownMenuTrigger asChild data-testid="add-company-btn">
                  <Button size="sm" className="gap-2 text-sm h-9">
                    <ChevronDown className="h-3 w-3" />
                    <span className="hidden sm:inline">Insert</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setAddCompanyDrawerOpen(true)} >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add Company</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Action Mode Controls - Shown only when companies are selected */}
          {selectedCompanies.size > 0 && (
            <>
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
                <DropdownMenuTrigger asChild data-testid="enrichment-dropdown">
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
                  {companyStates.hasEligibleForCompanyEnrichment && (
                    <DropdownMenuItem
                      onSelect={() => handleEnrichmentAction("company_enrichment")}
                    >
                      Company Enrichment ({companyStates.eligibleCompanyEnrichmentCount})
                    </DropdownMenuItem>
                  )}
                  {!companyStates.hasEligibleForCompanyEnrichment && selectedCompanies.size > 0 && (
                    <DropdownMenuItem disabled>
                      Company Enrichment ({companyStates.ineligibleCompanyEnrichmentCount} ineligible)
                    </DropdownMenuItem>
                  )}
                  {companyStates.hasEligibleForNewsEnrichment && (
                    <DropdownMenuItem
                      onSelect={() => handleEnrichmentAction("news_enrichment")}
                    >
                      News Enrichment ({companyStates.eligibleNewsEnrichmentCount})
                    </DropdownMenuItem>
                  )}
                  {!companyStates.hasEligibleForNewsEnrichment && selectedCompanies.size > 0 && (
                    <DropdownMenuItem disabled>
                      News Enrichment ({companyStates.ineligibleNewsEnrichmentCount} ineligible)
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete Button */}
              <Button
                size="sm"
                variant="destructive"
                className="gap-2 text-sm h-9"
                disabled={enrichmentLoading}
                onClick={handleDeleteCompanies}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Delete ({selectedCompanies.size})
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
                onClick={() => setSelectedCompanies(new Map())}
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Clear Selection</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </>
          )}

          {/* Add Company Drawer */}
          <AddCompanyDrawer
            open={addCompanyDrawerOpen}
            onOpenChange={setAddCompanyDrawerOpen}
            onSubmit={() => fetchDashboardData()}
          />
        </div>
      </div>

      {/* Main Content */}
      {authLoading || fetchLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
          <Loading />
          <p className="text-sm text-muted-foreground mt-4">Loading your companies...</p>
        </div>
      ) : (
        <div className="min-h-[400px] bg-white shadow-sm p-6">
          <CompaniesSection
            groupBy={groupBy}
            records={displayData as DashboardResponse}
            selectedCompanies={selectedCompanies}
            onCompanySelect={handleCompanySelect}
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

export default function CompaniesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-sm text-muted-foreground mt-4">Loading your companies...</p>
      </div>
    }>
      <TourProvider>
        {({ isJoyrideMode }) => <CompaniesPageContent isJoyrideMode={isJoyrideMode} />}
      </TourProvider>
    </Suspense>
  );
}

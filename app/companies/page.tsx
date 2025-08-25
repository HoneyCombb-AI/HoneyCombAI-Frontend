"use client";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { useSearchParams } from "next/navigation";
import { SAMPLE_COMPANY_DATA } from "@/lib/joyride/sampleData";
import { useTour } from "@/lib/joyride/useTour";

export type GroupByType = "none" | "industry" | "location" | "employee_size";
export type LocationType = "country" | "state" | "city";
export type SortBy = "name" | "created_at";
export type SortOrder = "asc" | "desc";

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

export default function CompaniesPage() {
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
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set()
  );
  const [addCompanyDrawerOpen, setAddCompanyDrawerOpen] = useState(false);
  const [enrichmentLoading, setEnrichmentLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const { isJoyrideMode } = useTour('companies');
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
    setSelectedCompanies(new Set());
  };

  // Company selection handlers
  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (companyIds: string[]) => {
    setSelectedCompanies((prev) => {
      const newSet = new Set(prev);
      const allSelected = companyIds.every((id) => newSet.has(id));

      if (allSelected) {
        // Deselect all
        companyIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all
        companyIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleEnrichmentAction = async (
    type:
      | "company_enrichment"
      | "full_workflow"
      | "news_enrichment"
      | "employee_discovery"
  ) => {
    if (selectedCompanies.size === 0) {
      toast.error("No companies selected for enrichment");
      return;
    }

    const selectedCompanyIds = Array.from(selectedCompanies);

    try {
      setEnrichmentLoading(true);

      const response = await axios.post("/api/companies/enrichment", {
        entity_ids: selectedCompanyIds,
        entity_type: "company_id",
        task_type: type
      });

      if (response.data.success) {
        toast.success(
          `${response.data.message}${response.data.tokens_used ? ` (${response.data.tokens_used} tokens used)` : ""
          }`
        );

        // Clear selected companies after successful enrichment
        setSelectedCompanies(new Set());

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
          errorData.errors.forEach((err: any) => {
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

    const selectedCompanyIds = Array.from(selectedCompanies);

    try {
      setExportLoading(true);
      
      const response = await fetch('/api/csv-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'companies',
          ids: selectedCompanyIds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `companies_export_${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and download
      const blob = await response.blob();
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
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExportLoading(false);
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
      <div className="flex min-h-screen w-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">HoneyComb - Companies</h1>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Alert>
            <AlertDescription>Failed to load data: {error}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      {/* Enhanced Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
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
            <span>Name ({sortOrder === "asc" ? "A-Z" : "Z-A"})</span>
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Page Size Control */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-sm">
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
              <Button size="sm" className="gap-2 text-sm">
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

          {/* Add Company Drawer */}
          <AddCompanyDrawer
            open={addCompanyDrawerOpen}
            onOpenChange={setAddCompanyDrawerOpen}
            onSubmit={(data) => console.log(data)}
          />
          {/* Export to CSV Button */}
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-sm"
            disabled={selectedCompanies.size === 0 || exportLoading}
            onClick={handleExportToCSV}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {exportLoading ? "Exporting..." : "Export to CSV"}
            </span>
            <span className="sm:hidden">
              {exportLoading ? "Exporting..." : "Export"}
            </span>
            {/* {!exportLoading && selectedCompanies.size > 0 && ` (${selectedCompanies.size})`} */}
          </Button>

          {/* Add Enrichment Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-testid="enrichment-dropdown">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-2 font-medium"
                disabled={selectedCompanies.size === 0 || enrichmentLoading}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {enrichmentLoading ? "Processing..." : "Add enrichment"}{" "}
                  {/* {!enrichmentLoading && selectedCompanies.size > 0 && `(${selectedCompanies.size})`} */}
                </span>
                <span className="sm:hidden">
                  {enrichmentLoading ? "Processing..." : "Enrich"}{" "}
                  {!enrichmentLoading && selectedCompanies.size > 0 && `(${selectedCompanies.size})`}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => handleEnrichmentAction("company_enrichment")}
              >
                Company Enrichment
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleEnrichmentAction("news_enrichment")}
              >
                News Enrichment
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleEnrichmentAction("employee_discovery")}
              >
                Employee Discovery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      {authLoading || fetchLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loading />
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

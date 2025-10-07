import { ChevronDown, ChevronRight, MoreHorizontal, MapPin } from 'lucide-react';
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupByType } from '@/app/companies/page';
import { CompaniesDrawer } from './CompaniesDrawer';
import { RingState } from '../Ring-state';
import type {
  DashboardCompany,
  CompanyListResponse,
  IndustryGroupResponse,
  LocationGroupResponse,
  EmployeeSizeGroupResponse,
  SearchResponse
} from '@/app/api/companies/route';

type DashboardResponse = CompanyListResponse | IndustryGroupResponse | LocationGroupResponse | EmployeeSizeGroupResponse | SearchResponse;

// Company validation data interface
interface CompanyValidationData {
  company_analysis_completed: boolean;
  company_analysis_requested: boolean;
  news_requested: boolean;
  name: string;
}

interface CompaniesSectionProps {
  groupBy: GroupByType;
  records: DashboardResponse;
  selectedCompanies: Map<string, CompanyValidationData>;
  onCompanySelect: (companyId: string, companyData: CompanyValidationData) => void;
  onSelectAll: (companiesData: Array<{ id: string, data: CompanyValidationData }>) => void;
}

interface ProcessedGroup {
  id: string;
  label: string;
  companies: DashboardCompany[];
  logoUrl?: string | null;
  metadata?: {
    companyCount?: number;
    totalContacts?: number;
    avgEmployees?: number;
  };
}

// Memoized Company Row Component
const CompanyRow = memo<{
  company: DashboardCompany;
  isSelected: boolean;
  onCompanySelect: (companyId: string, companyData: CompanyValidationData) => void;
  onCompanyClick: (company: DashboardCompany) => void;
}>(({ company, isSelected, onCompanySelect, onCompanyClick }) => {
  const topNudges = company.nudges?.slice(0, 3) || [];
  const hasAnalysisRequested = company.company_analysis_requested && !company.company_analysis_completed;
  const hasAnalysisCompleted = company.company_analysis_completed;
  const hasNewsRequested = company.news_requested;

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onCompanySelect(company.id, {
            company_analysis_completed: company.company_analysis_completed,
            company_analysis_requested: company.company_analysis_requested,
            news_requested: company.news_requested,
            name: company.name
          })}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* Company Name */}
      <td
        className="px-4 py-3 w-1/3 cursor-pointer"
        onClick={() => onCompanyClick(company)}
        data-testid="sample-company"
      >
        <div className="flex items-center gap-3">
          <RingState
            green={hasAnalysisCompleted}
            golden={hasNewsRequested}
            requested={hasAnalysisRequested}
            profilePicture={company.logo_url}
            fullName={company.name}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {company.name || "Unknown"}
            </div>
          </div>
        </div>
      </td>

      <td
        className="px-2 py-3 w-1/4 cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="text-sm text-gray-600 truncate" title={company.industry || "No industry"}>
          {company.industry || "—"}
        </div>
      </td>

      <td
        className="px-2 py-3 w-1/6 cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {company.city || company.country || "—"}
        </div>
      </td>

      <td
        className="px-2 py-3 w-1/12 cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="text-sm text-gray-600 text-center">
          {company.contact_count}
        </div>
      </td>

      <td
        className="px-2 py-3 w-1/4 cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="flex flex-wrap gap-1">
          {topNudges.length > 0 ? (
            topNudges.map((nudge, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200"
                title={nudge.description}
              >
                {nudge.intent}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props changed
  return (
    prevProps.company.id === nextProps.company.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.company.company_analysis_completed === nextProps.company.company_analysis_completed &&
    prevProps.company.company_analysis_requested === nextProps.company.company_analysis_requested &&
    prevProps.company.news_requested === nextProps.company.news_requested
  );
});


const CompaniesSection: React.FC<CompaniesSectionProps> = ({ groupBy, records, selectedCompanies, onCompanySelect, onSelectAll }) => {
  const groups = useMemo<ProcessedGroup[]>(() => {
    if (!records) return [];

    if (groupBy === 'none' && 'companies' in records) {
      return [{
        id: 'all-companies',
        label: 'All Companies',
        companies: records.companies,
        metadata: {
          companyCount: records.companies.length,
          totalContacts: records.companies.reduce((sum, company) => sum + company.contact_count, 0)
        }
      }];
    }

    if (groupBy === 'industry' && 'industries' in records) {
      return Object.entries(records.industries).map(([industry, industryData]) => ({
        id: industry,
        label: industry,
        companies: industryData.companies,
        metadata: {
          companyCount: industryData.companyCount,
          totalContacts: industryData.totalContacts,
          avgEmployees: industryData.avgEmployees
        }
      }));
    }

    if (groupBy === 'location' && 'locations' in records) {
      return Object.entries(records.locations).map(([location, locationData]) => ({
        id: location,
        label: location,
        companies: locationData.companies,
        metadata: {
          companyCount: locationData.companyCount,
          totalContacts: locationData.totalContacts
        }
      }));
    }

    if (groupBy === 'employee_size' && 'employee_sizes' in records) {
      return Object.entries(records.employee_sizes).map(([sizeRange, sizeData]) => ({
        id: sizeRange,
        label: sizeData.size_range,
        companies: sizeData.companies,
        metadata: {
          companyCount: sizeData.companyCount,
          totalContacts: sizeData.totalContacts
        }
      }));
    }

    if ('companies' in records && Array.isArray(records.companies)) {
      return [{
        id: 'search-results',
        label: 'Search Results',
        companies: records.companies,
        metadata: {
          companyCount: records.companies.length,
          totalContacts: records.companies.reduce((sum, company) => sum + company.contact_count, 0)
        }
      }];
    }

    return [];
  }, [groupBy, records]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<DashboardCompany | null>(null);

  const totalCompanies = useMemo(() =>
    groups.reduce((sum, g) => sum + g.companies.length, 0)
    , [groups]);

  const handleCompanyClick = useCallback((company: DashboardCompany) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const toggleAllCollapse = useCallback(() => {
    setCollapsedGroups(new Set(groups.map(g => g.id)));
    setAllCollapsed(true);
  }, [allCollapsed, groups]);

  return (
    <div className="space-y-4">
      {selectedCompany && (
        <CompaniesDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          selectedCompany={selectedCompany}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-medium text-gray-600">
            {`${totalCompanies} companies`}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-gray-900 text-sm"
          onClick={toggleAllCollapse}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>{'Collapse all groups'}</span>
        </Button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);

          return (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div
                className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleGroupCollapse(group.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-xs font-semibold">
                      {group.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {group.label}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.metadata?.avgEmployees && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Avg: {group.metadata.avgEmployees} employees
                    </Badge>
                  )}
                  {group.metadata?.totalContacts && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {group.metadata.totalContacts} contacts
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-gray-200 text-gray-700 text-xs"
                  >
                    {group.metadata?.companyCount || group.companies.length} compan
                    {(group.metadata?.companyCount || group.companies.length) !== 1 ? 'ies' : 'y'}
                  </Badge>
                </div>
              </div>

              {/* Company List - Always rendered, visibility controlled by CSS */}
              <div
                className="overflow-hidden"
                style={{ display: isCollapsed ? 'none' : 'block' }}
              >
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left font-medium w-12">
                        <Checkbox
                          checked={
                            group.companies.length > 0 &&
                            group.companies.every(company => selectedCompanies.has(company.id))
                          }
                          onCheckedChange={() => onSelectAll(
                            group.companies.map(company => ({
                              id: company.id,
                              data: {
                                company_analysis_completed: company.company_analysis_completed,
                                company_analysis_requested: company.company_analysis_requested,
                                news_requested: company.news_requested,
                                name: company.name
                              }
                            }))
                          )}
                        />
                      </th>
                      <th className="px-4 py-2 text-left font-medium w-1/3">Company</th>
                      <th className="px-2 py-2 text-left font-medium w-1/4">Industry</th>
                      <th className="px-2 py-2 text-left font-medium w-1/6">Location</th>
                      <th className="px-2 py-2 text-left font-medium w-1/12">Contacts</th>
                      <th className="px-2 py-2 text-left font-medium w-1/4">Signals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.companies.map((company) => (
                      <CompanyRow
                        key={company.id}
                        company={company}
                        isSelected={selectedCompanies.has(company.id)}
                        onCompanySelect={onCompanySelect}
                        onCompanyClick={handleCompanyClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompaniesSection;
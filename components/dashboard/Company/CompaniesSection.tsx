import { ChevronDown, ChevronRight, MoreHorizontal, MapPin, Edit3 } from 'lucide-react';
import React, { useState, useMemo, useCallback, memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GroupByType } from '@/app/(dashboard)/companies/page';
import { CompaniesDrawer } from './CompaniesDrawer';
import { NotesDrawer } from '../NotesDrawer';
import { RingState } from '../Ring-state';
import { ContactTags } from '../Tags';
import type {
  DashboardCompany,
  CompanyListResponse,
  IndustryGroupResponse,
  LocationGroupResponse,
  EmployeeSizeGroupResponse,
  SearchResponse
} from '@/types/companies';

type DashboardResponse = CompanyListResponse | IndustryGroupResponse | LocationGroupResponse | EmployeeSizeGroupResponse | SearchResponse;

// Company validation data interface
interface CompanyValidationData {
  istracked: boolean;
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
  onNotesClick: (companyId: string, companyName: string) => void;
}>(({ company, isSelected, onCompanySelect, onCompanyClick, onNotesClick }) => {
  const isTracked = company.istracked;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onCompanySelect(company.id, {
      istracked: company.istracked,
      name: company.name
    });
  };

  return (
    <tr
      className={`group/row hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''} relative`}
      onContextMenu={handleContextMenu}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-[4%]">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onCompanySelect(company.id, {
            istracked: company.istracked,
            name: company.name
          })}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* Company Name */}
      <td
        className="px-4 py-3 w-[28%] cursor-pointer"
        onClick={() => onCompanyClick(company)}
        data-testid="sample-company"
      >
        <div className="flex items-center gap-3">
          <RingState
            green={false}
            golden={isTracked}
            requested={false}
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
        className="px-2 py-3 w-[20%] cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="text-sm text-gray-600 truncate" title={company.industry || "No industry"}>
          {company.industry || "—"}
        </div>
      </td>

      <td
        className="px-2 py-3 w-[20%] cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="flex items-start gap-1">
          <MapPin className="h-3 w-3 text-gray-600 mt-0.5 shrink-0" />
          <div className="flex flex-col min-w-0">
            {company.city ? (
              <>
                <div className="text-sm text-gray-900 truncate">{company.city}</div>
                {(company.state || company.country) && (
                  <div className="text-xs text-gray-500 truncate">
                    {[company.state, company.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </>
            ) : company.state ? (
              <>
                <div className="text-sm text-gray-900 truncate">{company.state}</div>
                {company.country && (
                  <div className="text-xs text-gray-500 truncate">{company.country}</div>
                )}
              </>
            ) : company.country ? (
              <div className="text-sm text-gray-900 truncate">{company.country}</div>
            ) : (
              <div className="text-sm text-gray-600">—</div>
            )}
          </div>
        </div>
      </td>

      <td
        className="px-2 py-3 w-[12%] cursor-pointer"
        onClick={() => onCompanyClick(company)}
      >
        <div className="text-sm text-gray-600 text-center">
          {company.contact_count}
        </div>
      </td>

      {/* Tags */}
      <td
        className="px-2 py-3 w-[8%] cursor-pointer relative"
        onClick={() => onCompanyClick(company)}
      >
        <div className="flex items-center justify-between gap-2">
          <ContactTags
            tags={company.tags || []}
          />
          <div className="opacity-0 group-hover/row:opacity-100 transition-opacity absolute right-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 bg-white shadow-sm border border-gray-200 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onNotesClick(company.id, company.name);
              }}
            >
              <Edit3 className="h-3.5 w-3.5 text-gray-600" />
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
});

CompanyRow.displayName = 'CompanyRow';


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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<DashboardCompany | null>(null);

  // Notes drawer state
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [notesCompanyId, setNotesCompanyId] = useState<string | null>(null);
  const [notesCompanyName, setNotesCompanyName] = useState<string | null>(null);

  const totalCompanies = useMemo(() =>
    groups.reduce((sum, g) => sum + g.companies.length, 0)
    , [groups]);

  const handleCompanyClick = useCallback((company: DashboardCompany) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
  }, []);

  // Handle notes button click
  const handleNotesClick = useCallback((companyId: string, companyName: string) => {
    setNotesCompanyId(companyId);
    setNotesCompanyName(companyName);
    setNotesDrawerOpen(true);
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
  }, [groups]);

  return (
    <div className="space-y-4">
      {selectedCompany && (
        <CompaniesDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          selectedCompany={selectedCompany}
        />
      )}
      {notesCompanyId && (
        <NotesDrawer
          open={notesDrawerOpen}
          onOpenChange={setNotesDrawerOpen}
          notableId={notesCompanyId}
          notableType="company"
          notableName={notesCompanyName || undefined}
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
                      <th className="px-4 py-2 text-left font-medium w-[4%]">
                        <Checkbox
                          checked={
                            group.companies.length > 0 &&
                            group.companies.every(company => selectedCompanies.has(company.id))
                          }
                          onCheckedChange={() => onSelectAll(
                            group.companies.map(company => ({
                              id: company.id,
                              data: {
                                istracked: company.istracked,
                                name: company.name
                              }
                            }))
                          )}
                        />
                      </th>
                      <th className="px-4 py-2 text-left font-medium w-[28%]">Company</th>
                      <th className="px-2 py-2 text-left font-medium w-[20%]">Industry</th>
                      <th className="px-2 py-2 text-left font-medium w-[20%]">Location</th>
                      <th className="px-2 py-2 text-left font-medium w-[12%]">Contacts</th>
                      <th className="px-2 py-2 text-left font-medium w-[8%]">Tags</th>
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
                        onNotesClick={handleNotesClick}
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
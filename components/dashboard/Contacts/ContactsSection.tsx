import { ChevronDown, ChevronRight, MoreHorizontal, Edit3, Tag } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GroupByType } from '@/app/contacts/page';
import type {
  DashboardContact,
  CompanyGroupResponse,
  SignalGroupResponse,
  LocationGroupResponse,
  SearchResponse
} from '@/app/api/contacts/route';
import { ContactsDrawer } from './ContactsDrawer';
import { RingState } from '../Ring-state';
import { SignalState } from '../Signal-state';

type DashboardResponse = CompanyGroupResponse | SignalGroupResponse | LocationGroupResponse | SearchResponse;

// Contact validation data interface
interface ContactValidationData {
  isTracked: boolean;
  primaryAnalysisCompleted: boolean;
  primaryAnalysisRequested: boolean;
  full_name: string;
}

// Props for ContactsSection
interface ContactsSectionProps {
  groupBy: GroupByType;
  records: DashboardResponse;
  selectedContacts: Map<string, ContactValidationData>;
  onContactSelect: (contactId: string, contactData: ContactValidationData) => void;
  onSelectAll: (contactsData: Array<{ id: string, data: ContactValidationData }>) => void;
}

// Interface for processed group data
interface ProcessedGroup {
  id: string;
  label: string;
  contacts: DashboardContact[];
  logoUrl?: string | null;
  metadata?: {
    contactCount?: number;
    avgConfidence?: number;
    signalType?: string;
  };
}


// Memoized Contact Row Component
const ContactRow = memo<{
  contact: DashboardContact;
  isSelected: boolean;
  onContactSelect: (contactId: string, contactData: ContactValidationData) => void;
  onContactClick: (contact: DashboardContact) => void;
}>(({ contact, isSelected, onContactSelect, onContactClick }) => {
  const hasAnalysisRequested = contact.primaryAnalysisRequested && !contact.primaryAnalysisCompleted;
  const hasAnalysisCompleted = contact.primaryAnalysisCompleted;
  const isTracked = contact.isTracked;

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onContactSelect(contact.id, {
            isTracked: contact.isTracked,
            primaryAnalysisCompleted: contact.primaryAnalysisCompleted,
            primaryAnalysisRequested: contact.primaryAnalysisRequested,
            full_name: contact.full_name
          })}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* Name with Title */}
      <td
        className="px-4 py-3 w-1/5 cursor-pointer"
        onClick={() => onContactClick(contact)}
        data-testid="sample-contact"
      >
        <div className="flex items-center gap-3">
          <RingState
            green={hasAnalysisCompleted}
            golden={isTracked}
            requested={hasAnalysisRequested}
            profilePicture={contact.profile_picture}
            fullName={contact.full_name}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {contact.full_name || "Unknown"}
            </div>
            {contact.title && (
              <div className="text-xs text-gray-500 mt-0.5" title={contact.title}>
                {contact.title}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td
        className="px-2 py-3 w-[15%] cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        <div className="text-sm text-gray-600" title={contact.company?.name || "No company"}>
          {contact.company?.name || "—"}
        </div>
      </td>

      {/* Location */}
      <td
        className="px-2 py-3 w-[12%] cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        <div className="text-sm text-gray-600 truncate">
          {contact.city || "—"}
        </div>
      </td>

      {/* Actions */}
      <td className="px-2 py-3 w-[10%]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Handle edit notes
            }}
            title="Edit notes"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Handle add tag
            }}
            title="Add tag"
          >
            <Tag className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>

      {/* Temperature */}
      <td
        className="px-2 py-3 w-[8%] cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        {contact.temperature && (
          <div className="flex justify-center">
            <div
              className={`w-2 h-2 rounded-full ${
                contact.temperature === 'hot'
                  ? 'bg-red-500'
                  : contact.temperature === 'warm'
                  ? 'bg-orange-400'
                  : 'bg-blue-400'
              }`}
              title={contact.temperature.charAt(0).toUpperCase() + contact.temperature.slice(1)}
            />
          </div>
        )}
      </td>

      {/* Tags */}
      <td
        className="px-2 py-3 w-[15%] cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        <div className="flex flex-wrap gap-1">
          {/* TODO: Replace with actual tags from contact data */}
          {/* Placeholder for now - using outlined style different from temperature */}
          {/* Example: */}
          {/* <span className="text-xs px-2 py-0.5 border border-gray-300 rounded-md text-gray-700">Tag1</span> */}
        </div>
      </td>

      {/* Signals */}
      <td
        className="px-2 py-3 w-1/4 cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        <SignalState
          signals={contact.signals}
          contactId={contact.id}
        />
      </td>
    </tr>
  );
});

ContactRow.displayName = 'ContactRow';



const ContactsSection: React.FC<ContactsSectionProps> = ({ groupBy, records, selectedContacts, onContactSelect, onSelectAll }) => {
  // Memoized groups processing for performance
  const groups = useMemo<ProcessedGroup[]>(() => {
    if (!records) return [];

    // Handle CompanyGroupResponse
    if (groupBy === 'company' && 'companies' in records) {
      return records.companies.map(company => ({
        id: company.id,
        label: company.name,
        contacts: company.contacts,
        logoUrl: company.logo_url,
        metadata: {
          contactCount: company.contactCount
        }
      }));
    }

    // Handle SignalGroupResponse
    if (groupBy === 'signals' && 'signals' in records) {
      return Object.entries(records.signals).map(([signalType, signalData]) => ({
        id: signalType,
        label: signalType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        contacts: signalData.contacts,
        metadata: {
          contactCount: signalData.contactCount,
          avgConfidence: signalData.avgConfidence,
          signalType: signalData.signal_type
        }
      }));
    }

    // Handle LocationGroupResponse
    if (groupBy === 'location' && 'locations' in records) {
      return Object.entries(records.locations).map(([location, locationData]) => ({
        id: location,
        label: location,
        contacts: locationData.contacts,
        metadata: {
          contactCount: locationData.contactCount
        }
      }));
    }

    // Handle SearchResponse
    if ('contacts' in records && Array.isArray(records.contacts)) {
      return [{
        id: 'search-results',
        label: 'Results',
        contacts: records.contacts,
        metadata: {
          contactCount: records.contacts.length
        }
      }];
    }

    return [];
  }, [groupBy, records]);

  // State for managing collapsed groups - ALL COLLAPSED BY DEFAULT
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(true);

  // Total contacts
  const totalContacts = useMemo(() =>
    groups.reduce((sum, g) => sum + (g.contacts?.length || 0), 0)
    , [groups]);


  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<DashboardContact | null>(null)
  // Handle contact click
  const handleContactClick = useCallback((contact: DashboardContact) => {
    setSelectedContact(contact)
    setDrawerOpen(true)
  }, []);

  // Toggle individual group collapse
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
      {selectedContact && (
        <ContactsDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          selectedContact={selectedContact}
        />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-medium text-gray-600">
            {`${totalContacts} records`}
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

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);

          return (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Group Header */}
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
                    {group.logoUrl ? (
                      <div className="w-6 h-6 rounded relative overflow-hidden flex-shrink-0">
                        <Image
                          src={group.logoUrl}
                          alt="Company logo"
                          fill
                          sizes="px"
                          className="object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      </div>
                    ) : null}
                    <div
                      className={`w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-xs font-semibold ${group.logoUrl ? 'hidden' : ''}`}
                    >
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
                  {group.metadata?.avgConfidence !== undefined && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Avg: {group.metadata.avgConfidence.toFixed(1)}%
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-gray-200 text-gray-700 text-xs"
                  >
                    {group.metadata?.contactCount || group.contacts?.length || 0} record
                    {(group.metadata?.contactCount || group.contacts?.length || 0) !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Contact List - Always rendered, visibility controlled by CSS */}
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
                            (group.contacts?.length || 0) > 0 &&
                            group.contacts?.every(contact => selectedContacts.has(contact.id))
                          }
                          onCheckedChange={() => onSelectAll(
                            group.contacts?.map(contact => ({
                              id: contact.id,
                              data: {
                                isTracked: contact.isTracked,
                                primaryAnalysisCompleted: contact.primaryAnalysisCompleted,
                                primaryAnalysisRequested: contact.primaryAnalysisRequested,
                                full_name: contact.full_name
                              }
                            })) || []
                          )}
                        />
                      </th>
                      <th className="px-4 py-2 text-left font-medium w-1/5">Name</th>
                      <th className="px-2 py-2 text-left font-medium w-[15%]">Company</th>
                      <th className="px-2 py-2 text-left font-medium w-[12%]">Location</th>
                      <th className="px-2 py-2 text-left font-medium w-[10%]">Actions</th>
                      <th className="px-2 py-2 text-center font-medium w-[8%]"></th>
                      <th className="px-2 py-2 text-left font-medium w-[15%]">Tags</th>
                      <th className="px-2 py-2 text-left font-medium w-1/4">Signals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(group.contacts || []).map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContacts.has(contact.id)}
                        onContactSelect={onContactSelect}
                        onContactClick={handleContactClick}
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

export default ContactsSection;
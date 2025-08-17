import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useMemo, useCallback } from 'react';
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
import { getSignalBadgeColor, processSignals } from '@/lib/ContactUtils';

type DashboardResponse = CompanyGroupResponse | SignalGroupResponse | LocationGroupResponse | SearchResponse;

// Props for ContactsSection
interface ContactsSectionProps {
  groupBy: GroupByType;
  records: DashboardResponse;
  selectedContacts: Set<string>;
  onContactSelect: (contactId: string) => void;
  onSelectAll: (contactIds: string[]) => void;
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

const truncateTitle = (title: string) => {
  if (!title) return "No title";
  const words = title.split(' ');
  return words.length > 3 ? words.slice(0, 3).join(' ') + '...' : title;
};



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

  // Memoized render contacts function with reduced padding
  const renderContacts = useMemo(() =>
    (contacts: DashboardContact[]) =>
      contacts.map((contact) => {
        const processedSignals = processSignals(contact.signals);
        const isSelected = selectedContacts.has(contact.id);

        return (
          <tr
            key={contact.id}
            className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''}`}
          >
            {/* Checkbox */}
            <td className="px-4 py-3 w-12">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onContactSelect(contact.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </td>
            
            {/* Name */}
            <td 
              className="px-4 py-3 w-1/4 cursor-pointer"
              onClick={() => handleContactClick(contact)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative">
                  {contact.profile_picture ? (
                    <Image
                      src={contact.profile_picture}
                      alt={contact.full_name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 
                    flex items-center justify-center text-white text-sm font-medium">
                      {contact.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {contact.full_name || "Unknown"}
                  </div>
                </div>
              </div>
            </td>

            {/* Title */}
            <td 
              className="px-2 py-3 w-1/5 cursor-pointer"
              onClick={() => handleContactClick(contact)}
            >
              <div className="text-sm text-gray-600 truncate" title={contact.title || "No title"}>
                {truncateTitle(contact.title || "")}
              </div>
            </td>

            {/* Location */}
            <td 
              className="px-2 py-3 w-1/6 cursor-pointer"
              onClick={() => handleContactClick(contact)}
            >
              <div className="text-sm text-gray-600 truncate">
                {contact.city || "—"}
              </div>
            </td>

            {/* Signals */}
            <td 
              className="px-2 py-3 w-1/3 cursor-pointer"
              onClick={() => handleContactClick(contact)}
            >
              <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                {processedSignals.length > 0 ? (
                  processedSignals.map((signal, idx) => {
                    const colorClass = getSignalBadgeColor(signal.key);
                    return (
                      <Badge
                        key={`${contact.id}-${signal.type}-${idx}`}
                        className={`text-xs px-1.5 py-0.5 ${colorClass} border-0 whitespace-nowrap truncate`}
                        title={`${signal.key}: ${signal.score}`}
                      >
                        {signal.key}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </td>

          </tr>
        );
      })
    , [handleContactClick, selectedContacts, onContactSelect]);

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

              {/* Contact List - Only show if not collapsed */}
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2 text-left font-medium w-12">
                          <Checkbox
                            checked={
                              (group.contacts?.length || 0) > 0 && 
                              group.contacts?.every(contact => selectedContacts.has(contact.id))
                            }
                            onCheckedChange={() => onSelectAll(group.contacts?.map(contact => contact.id) || [])}
                          />
                        </th>
                        <th className="px-4 py-2 text-left font-medium w-1/5">Name</th>
                        <th className="px-2 py-2 text-left font-medium w-1/4">Title</th>
                        <th className="px-2 py-2 text-left font-medium w-1/8">Location</th>
                        <th className="px-2 py-2 text-left font-medium w-1/3">Signals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderContacts(group.contacts || [])}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactsSection;
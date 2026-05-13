import { ChevronDown, ChevronRight, MoreHorizontal, Edit3 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GroupByType } from '@/app/(dashboard)/contacts/page';
import type {
  DashboardContact,
  CompanyGroupResponse,
  LocationGroupResponse,
  SearchResponse,
  TagGroupResponse
} from '@/types/contacts';
import { ContactsDrawer } from './ContactsDrawer';
import { NotesDrawer } from '../NotesDrawer';
import { RingState } from '../Ring-state';
import { SignalState } from '../Signal-state';
import { ContactTags } from '../Tags';

type DashboardResponse = CompanyGroupResponse | LocationGroupResponse | SearchResponse | TagGroupResponse;

// Idle-scheduling helpers — resolved once at module load, SSR-safe
type IdleHandle = ReturnType<typeof setTimeout> | ReturnType<typeof requestIdleCallback>;

const hasIdleCb = typeof requestIdleCallback !== 'undefined';

const scheduleIdle = (cb: () => void): IdleHandle =>
  hasIdleCb
    ? requestIdleCallback(cb, { timeout: 3000 })
    : setTimeout(cb, 100);

const cancelIdle = (handle: IdleHandle): void =>
  hasIdleCb
    ? cancelIdleCallback(handle as number)
    : clearTimeout(handle as ReturnType<typeof setTimeout>);

// Contact validation data interface
interface ContactValidationData {
  primaryAnalysisCompleted: boolean;
  primaryAnalysisRequested: boolean;
  full_name: string;
  company_id: string | null;
  email: string | null;
}

// Props for ContactsSection
interface ContactsSectionProps {
  groupBy: GroupByType;
  records: DashboardResponse;
  selectedContacts: Map<string, ContactValidationData>;
  onContactSelect: (contactId: string, contactData: ContactValidationData) => void;
  onSelectAll: (contactsData: Array<{ id: string, data: ContactValidationData }>) => void;
  filterCompanyId?: string | null;
}

// Interface for processed group data
interface ProcessedGroup {
  id: string;
  label: string;
  contacts: DashboardContact[];
  logoUrl?: string | null;
  tagColor?: string | null;
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
  isHidden: boolean;
  onContactSelect: (contactId: string, contactData: ContactValidationData) => void;
  onContactClick: (contact: DashboardContact) => void;
  onNotesClick: (contactId: string, contactName: string) => void;
  isFirstInGroup?: boolean;
}>(({ contact, isSelected, isHidden, onContactSelect, onContactClick, onNotesClick, isFirstInGroup }) => {
  const hasAnalysisRequested = contact.primaryAnalysisRequested && !contact.primaryAnalysisCompleted;
  const hasAnalysisCompleted = contact.primaryAnalysisCompleted;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onContactSelect(contact.id, {
      primaryAnalysisCompleted: contact.primaryAnalysisCompleted,
      primaryAnalysisRequested: contact.primaryAnalysisRequested,
      full_name: contact.full_name,
      company_id: contact.company?.id || null,
      email: contact.email ?? null,
    });
  };

  return (
    <tr
      style={{ display: isHidden ? 'none' : undefined }}
      className={`group/row hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-blue-50' : ''} relative`}
      onContextMenu={handleContextMenu}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onContactSelect(contact.id, {
            primaryAnalysisCompleted: contact.primaryAnalysisCompleted,
            primaryAnalysisRequested: contact.primaryAnalysisRequested,
            full_name: contact.full_name,
            company_id: contact.company?.id || null,
            email: contact.email ?? null,
          })}
          onClick={(e) => e.stopPropagation()}
          data-testid={isFirstInGroup ? "first-contact-checkbox" : undefined}
        />
      </td>

      {/* Name with Title */}
      <td
        className="px-4 py-3 w-[24%] cursor-pointer"
        onClick={() => onContactClick(contact)}
        data-testid="sample-contact"
      >
        <div className="flex items-center gap-3">
          <RingState
            green={hasAnalysisCompleted}
            golden={false}
            requested={hasAnalysisRequested}
            profilePicture={contact.profile_picture}
            fullName={contact.full_name}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {contact.full_name || "Unknown"}
            </div>
            {contact.title && (
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2" title={contact.title}>
                {contact.title}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td
        className="px-2 py-3 w-[18%] cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        <div className="text-sm text-gray-600" title={contact.company?.name || "No company"}>
          {contact.company?.name || "—"}
        </div>
      </td>

      {/* Location */}
      <td
        className="px-2 py-3 w-[11%] cursor-pointer"
        onClick={() => onContactClick(contact)}
      >
        <div className="text-sm truncate">
          {contact.city ? (
            <span className="text-gray-600">{contact.city}</span>
          ) : contact.country ? (
            <span className="text-gray-400">{contact.country}</span>
          ) : (
            <span className="text-gray-600">—</span>
          )}
        </div>
      </td>

      {/* Tags */}
      <td
        className="px-2 py-3 w-[7%] cursor-pointer"
        onClick={() => onContactClick(contact)}
        data-testid={isFirstInGroup ? "sample-contact-tags" : undefined}
      >
        <ContactTags
          tags={contact.tags || []}
        />
      </td>

      {/* Signals */}
      <td
        className="px-2 py-3 w-[35%] cursor-pointer overflow-hidden"
        onClick={() => onContactClick(contact)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <SignalState
              signals={contact.signals}
              contactId={contact.id}
            />
          </div>
          {/* Notes Icon - Persistent if hasNotes, shows edit button on hover otherwise */}
          {contact.hasNotes ? (
            <div className="relative shrink-0">
              {/* Vertical rope line — centered on button, extends beyond and clipped by td overflow-hidden */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[2.5px] bg-blue-600 pointer-events-none"
                style={{ top: '-100px', bottom: '-100px' }}
              />
              {/* Notes button icon */}
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Notes for ${contact.full_name}`}
                className="h-7 w-7 p-0 bg-white shadow-sm border border-blue-200 hover:bg-blue-50 hover:scale-110 transition-transform duration-200 z-10 relative"
                onClick={(e) => {
                  e.stopPropagation();
                  onNotesClick(contact.id, contact.full_name);
                }}
              >
                <Edit3 className="h-4 w-4 text-blue-600 hover:text-blue-700 transition-colors duration-200" />
              </Button>
            </div>
          ) : (
            <div className="opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Notes for ${contact.full_name}`}
                className="h-6 w-6 p-0 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:scale-110 transition-transform duration-200 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onNotesClick(contact.id, contact.full_name);
                }}
              >
                <Edit3 className="h-3.5 w-3.5 text-gray-600 hover:text-gray-900 transition-colors duration-200" />
              </Button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

ContactRow.displayName = 'ContactRow';



const ContactsSection: React.FC<ContactsSectionProps> = ({ groupBy, records, selectedContacts, onContactSelect, onSelectAll, filterCompanyId }) => {
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

    // Handle TagGroupResponse
    if (groupBy === 'tags' && 'tags' in records) {
      return Object.entries(records.tags).map(([tagKey, tagData]) => ({
        id: tagKey,
        label: tagData.tagName,
        contacts: tagData.contacts,
        tagColor: tagData.color,
        metadata: {
          contactCount: tagData.contactCount
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

  // Combined state: expanded (currently visible) + mounted (rows in DOM, never shrinks)
  const [groupVisibility, setGroupVisibility] = useState<{
    expanded: Set<string>;
    mounted: Set<string>;
  }>({ expanded: new Set(), mounted: new Set() });

  // Stale-closure guard for progressive idle mounting
  const idleAbortedRef = useRef(false);

  // Reset on new data — first group expanded immediately, rest mounted progressively in idle frames
  useEffect(() => {
    idleAbortedRef.current = false;

    const firstId = groups[0]?.id;
    const initialSet = firstId ? new Set([firstId]) : new Set<string>();

    setGroupVisibility({ expanded: new Set(initialSet), mounted: new Set(initialSet) });

    // Progressively mount remaining groups during idle time
    const remaining = groups.slice(1).map(g => g.id);
    if (remaining.length === 0) return;

    let currentIdx = 0;
    let handle: IdleHandle;

    const mountNext = () => {
      if (idleAbortedRef.current || currentIdx >= remaining.length) return;

      const idToMount = remaining[currentIdx];
      currentIdx++;

      setGroupVisibility(prev => {
        if (prev.mounted.has(idToMount)) return prev;
        const nextMounted = new Set(prev.mounted);
        nextMounted.add(idToMount);
        return { ...prev, mounted: nextMounted };
      });

      // Schedule next group
      if (currentIdx < remaining.length) {
        handle = scheduleIdle(mountNext);
      }
    };

    handle = scheduleIdle(mountNext);

    return () => {
      idleAbortedRef.current = true;
      cancelIdle(handle);
    };
  }, [groups]);


  // Pre-computed visible count per group — avoids O(n) .filter() inside the render loop
  const visibleCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of groups) {
      if (filterCompanyId && groupBy !== 'company') {
        let count = 0;
        for (const c of g.contacts) {
          if (c.company?.id === filterCompanyId) count++;
        }
        map.set(g.id, count);
      } else {
        map.set(g.id, g.metadata?.contactCount ?? g.contacts?.length ?? 0);
      }
    }
    return map;
  }, [groups, filterCompanyId, groupBy]);

  // Total visible contacts — filter-aware, no array allocation
  const totalContacts = useMemo(() => {
    if (!filterCompanyId) return groups.reduce((sum, g) => sum + (g.contacts?.length || 0), 0);
    if (groupBy === 'company') return groups.find(g => g.id === filterCompanyId)?.contacts?.length || 0;
    let total = 0;
    visibleCountMap.forEach(v => { total += v; });
    return total;
  }, [groups, filterCompanyId, groupBy, visibleCountMap]);


  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<DashboardContact | null>(null)

  // Notes drawer state
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false)
  const [notesContactId, setNotesContactId] = useState<string | null>(null)
  const [notesContactName, setNotesContactName] = useState<string | null>(null)

  // Handle contact click
  const handleContactClick = useCallback((contact: DashboardContact) => {
    setSelectedContact(contact)
    setDrawerOpen(true)
  }, []);

  // Handle notes button click
  const handleNotesClick = useCallback((contactId: string, contactName: string) => {
    setNotesContactId(contactId)
    setNotesContactName(contactName)
    setNotesDrawerOpen(true)
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setGroupVisibility(prev => {
      const newExpanded = new Set(prev.expanded);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      // Mark rows as mounted on first expand — stays mounted forever after
      const newMounted = prev.mounted.has(groupId)
        ? prev.mounted
        : new Set([...prev.mounted, groupId]);
      return { expanded: newExpanded, mounted: newMounted };
    });
  }, []);

  const toggleAllCollapse = useCallback(() => {
    setGroupVisibility(prev => ({ ...prev, expanded: new Set() }));
  }, []);

  return (
    <div className="space-y-4">
      {selectedContact && (
        <ContactsDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          selectedContact={selectedContact}
        />
      )}
      {notesContactId && (
        <NotesDrawer
          open={notesDrawerOpen}
          onOpenChange={setNotesDrawerOpen}
          notableId={notesContactId}
          notableType="contact"
          notableName={notesContactName || undefined}
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
        {groups.map((group: ProcessedGroup) => {
          const isExpanded = groupVisibility.expanded.has(group.id);
          const rowsMounted = groupVisibility.mounted.has(group.id);
          const isGroupHidden = groupBy === 'company' && !!filterCompanyId && group.id !== filterCompanyId;
          const visibleCount = visibleCountMap.get(group.id) ?? 0;

          return (
            <div
              key={group.id}
              style={{ display: isGroupHidden ? 'none' : undefined, contain: 'style' }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Group Header */}
              <div
                className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleGroupCollapse(group.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <div className="flex items-center gap-3">
                    {group.logoUrl ? (
                      <div className="w-6 h-6 rounded relative overflow-hidden shrink-0">
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
                    ) : group.tagColor ? (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: group.tagColor }}
                      >
                        {group.label.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                    <div
                      className={`w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-xs font-semibold ${group.logoUrl || group.tagColor ? 'hidden' : ''}`}
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
                    className={visibleCount > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs"
                      : "bg-gray-100 text-gray-400 text-xs"
                    }
                  >
                    {visibleCount} record{visibleCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Rows lazily mounted on first expand, CSS-controlled after */}
              {rowsMounted && (
              <div
                className="overflow-hidden"
                style={{ display: isExpanded ? 'block' : 'none' }}
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
                                primaryAnalysisCompleted: contact.primaryAnalysisCompleted,
                                primaryAnalysisRequested: contact.primaryAnalysisRequested,
                                full_name: contact.full_name,
                                company_id: contact.company?.id || null,
                                email: contact.email ?? null,
                              }
                            })) || []
                          )}
                        />
                      </th>
                      <th className="px-4 py-2 text-left font-medium w-[24%]">Name</th>
                      <th className="px-2 py-2 text-left font-medium w-[18%]">Company</th>
                      <th className="px-2 py-2 text-left font-medium w-[11%]">Location</th>
                      <th className="px-2 py-2 text-left font-medium w-[7%]">Tags</th>
                      <th className="px-2 py-2 text-left font-medium w-[35%]">Signals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(group.contacts || []).map((contact: DashboardContact, index: number) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContacts.has(contact.id)}
                        isHidden={groupBy !== 'company' && !!filterCompanyId && contact.company?.id !== filterCompanyId}
                        onContactSelect={onContactSelect}
                        onContactClick={handleContactClick}
                        onNotesClick={handleNotesClick}
                        isFirstInGroup={index === 0}
                      />
                    ))}
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
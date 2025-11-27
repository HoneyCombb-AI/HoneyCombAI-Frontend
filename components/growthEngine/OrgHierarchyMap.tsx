"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompanyHierarchySegment } from "@/app/api/growthEngine/companies/[companyId]/hierarchy/route";
import type { ContactSummary } from "@/app/api/growthEngine/contacts/bulk/route";

interface OrgHierarchyMapProps {
  segments: CompanyHierarchySegment[];
  membersById: Record<string, ContactSummary>;
  onContactClick?: (contactId: string) => void;
}

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function OrgHierarchyMap({ segments, membersById, onContactClick }: OrgHierarchyMapProps) {
  return (
    <div className="space-y-6">
      {segments.map((segment, idx) => {
        const members = (segment.members || []).map((id) => membersById[id] || { contact_id: id, full_name: null, headline: null, profile_picture_url: null });
        return (
          <Card key={idx} className="border border-muted bg-white">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Level {idx + 1}</Badge>
                <h3 className="text-lg font-semibold">{segment.name ?? `Segment ${idx + 1}`}</h3>
                <div className="ml-auto text-xs text-muted-foreground">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </div>
              </div>
              {segment.description && (
                <p className="text-sm text-muted-foreground">{segment.description}</p>
              )}
              {segment.rationale && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  {segment.rationale}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {members.map((member) => (
                  <Card
                    key={member.contact_id}
                    className="border border-muted bg-slate-50 hover:shadow-md transition cursor-pointer"
                    onClick={() => onContactClick?.(member.contact_id)}
                  >
                    <CardContent className="p-3 flex items-start gap-3">
                      <Avatar className="w-10 h-10 border border-primary/20">
                        {member.profile_picture_url && (
                          <AvatarImage src={member.profile_picture_url} alt="Profile" />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {member.full_name || "Unknown contact"}
                        </p>
                        {member.headline && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {member.headline}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

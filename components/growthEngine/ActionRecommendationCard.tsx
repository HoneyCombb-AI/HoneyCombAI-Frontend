"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, CheckCircle2, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyAction } from "@/app/api/growthEngine/companies/[companyId]/actions/route";

type ActionRecommendationCardProps = CompanyAction;

const formatText = (text: string | null) =>
  (text ?? "Action")
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const stepFromId = (action_id: string) => {
  const match = action_id.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
};

export function ActionRecommendationCard(props: ActionRecommendationCardProps) {
  const {
    action_id,
    action_type,
    natural_language_action,
    rationale,
    priority,
    deal_stage,
    target_contact_name,
    target_contact_title,
    target_contact_role,
    timeline,
    analysis_date,
    expected_outcome,
    personalization_used_json,
    draft_connection_note,
    draft_tone_notes,
    draft_follow_up_if_accepted,
    draft_follow_up_if_no_response,
    draft_message_draft,
    draft_subject_line,
  } = props;

  const getActionIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("email")) return <Mail className="w-4 h-4" />;
    if (lower.includes("call") || lower.includes("phone")) return <Phone className="w-4 h-4" />;
    if (lower.includes("meeting") || lower.includes("calendar")) return <Calendar className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const getPriorityColor = (value: string) => {
    const lower = value.toLowerCase();
    if (lower === "critical") return "bg-red-500/10 text-red-600 border-red-200";
    if (lower === "high") return "bg-orange-500/10 text-orange-600 border-orange-200";
    if (lower === "medium") return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    return "bg-blue-500/10 text-blue-600 border-blue-200";
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-500/10 text-gray-600";
    const lower = status.toLowerCase();
    if (lower.includes("completed") || lower.includes("executed")) return "bg-green-500/10 text-green-600";
    if (lower.includes("progress")) return "bg-blue-500/10 text-blue-600";
    if (lower.includes("skipped")) return "bg-gray-500/10 text-gray-600";
    return "bg-yellow-500/10 text-yellow-600";
  };

  const safePriority = priority || "medium";
  const safeStatus = deal_stage || "pending";
  const step = stepFromId(action_id);
  const formattedType = formatText(action_type);
  const formattedTimeline = timeline ? formatText(timeline) : null;

  return (
    <Card className="border border-muted bg-slate-50 hover:shadow-lg transition-shadow h-full">
      <CardContent className="p-4 space-y-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {getActionIcon(action_type)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary text-sm">{formattedType}</Badge>
                <Badge className={cn(getPriorityColor(safePriority), "border")}>
                  <Flag className="w-3 h-3 mr-1" />
                  {safePriority}
                </Badge>
              </div>
              {formattedTimeline && (
                <p className="text-xs text-muted-foreground">
                  Timeline: {formattedTimeline}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeof step === "number" && (
              <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-semibold">
                {step}
              </div>
            )}
            <Badge className={cn(getStatusColor(safeStatus))}>
              {safeStatus.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Target contact */}
        {(target_contact_name || target_contact_title || target_contact_role) && (
          <div className="space-y-1 text-sm border rounded-lg p-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground">Target Contact</p>
            <p className="font-semibold">{target_contact_name}</p>
            <p className="text-muted-foreground">
              {[target_contact_title, target_contact_role].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}

        {/* Action details */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-relaxed">
            {natural_language_action || "No description available"}
          </p>
          {expected_outcome && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Expected Outcome</p>
              <p className="text-sm leading-relaxed">{expected_outcome}</p>
            </div>
          )}
          {rationale && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground">Rationale</p>
              <p className="text-sm text-muted-foreground">{rationale}</p>
            </div>
          )}
        </div>

        {/* Draft content */}
        {(draft_connection_note ||
          draft_tone_notes ||
          draft_follow_up_if_accepted ||
          draft_follow_up_if_no_response ||
          draft_message_draft ||
          draft_subject_line) && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground">Draft Content</p>
            {draft_connection_note && (
              <p className="text-sm"><span className="font-semibold">Connection note:</span> {draft_connection_note}</p>
            )}
            {draft_subject_line && (
              <p className="text-sm"><span className="font-semibold">Subject:</span> {draft_subject_line}</p>
            )}
            {draft_message_draft && (
              <p className="text-sm"><span className="font-semibold">Message:</span> {draft_message_draft}</p>
            )}
            {draft_tone_notes && (
              <p className="text-sm"><span className="font-semibold">Tone:</span> {draft_tone_notes}</p>
            )}
            {draft_follow_up_if_accepted && (
              <p className="text-sm"><span className="font-semibold">If accepted:</span> {draft_follow_up_if_accepted}</p>
            )}
            {draft_follow_up_if_no_response && (
              <p className="text-sm"><span className="font-semibold">If no response:</span> {draft_follow_up_if_no_response}</p>
            )}
          </div>
        )}

        {/* Footer */}
        {(analysis_date || timeline) && (
          <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {analysis_date && (
                <>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(analysis_date).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

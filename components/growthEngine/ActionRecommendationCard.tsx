"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Calendar, CheckCircle2, Clock, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionRecommendationCardProps {
  actionType: string
  description: string
  rationale?: string
  priority: string
  status: string
  targetContacts?: string[]
  validUntil?: string
  onMarkComplete?: () => void
  onSkip?: () => void
}

export function ActionRecommendationCard({
  actionType,
  description,
  rationale,
  priority,
  status,
  targetContacts,
  validUntil,
  onMarkComplete,
  onSkip
}: ActionRecommendationCardProps) {
  
  const getActionIcon = (type: string) => {
    const lower = type.toLowerCase()
    if (lower === "email") return <Mail className="w-4 h-4" />
    if (lower === "call" || lower === "phone") return <Phone className="w-4 h-4" />
    if (lower === "meeting") return <Calendar className="w-4 h-4" />
    return <CheckCircle2 className="w-4 h-4" />
  }

  const getPriorityColor = (priority: string) => {
    const lower = priority.toLowerCase()
    if (lower === "critical") return "bg-red-500/10 text-red-600 border-red-200"
    if (lower === "high") return "bg-orange-500/10 text-orange-600 border-orange-200"
    if (lower === "medium") return "bg-yellow-500/10 text-yellow-600 border-yellow-200"
    return "bg-blue-500/10 text-blue-600 border-blue-200"
  }

  const getStatusColor = (status: string) => {
    const lower = status.toLowerCase()
    if (lower === "completed" || lower === "executed") return "bg-green-500/10 text-green-600"
    if (lower === "in-progress" || lower === "in_progress") return "bg-blue-500/10 text-blue-600"
    if (lower === "skipped") return "bg-gray-500/10 text-gray-600"
    return "bg-yellow-500/10 text-yellow-600"
  }

  const isCompleted = status.toLowerCase() === "completed" || status.toLowerCase() === "executed"
  const isSkipped = status.toLowerCase() === "skipped"

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-300",
      isCompleted && "opacity-60",
      priority.toLowerCase() === "critical" && "border-l-red-500",
      priority.toLowerCase() === "high" && "border-l-orange-500",
      priority.toLowerCase() === "medium" && "border-l-yellow-500",
      priority.toLowerCase() === "low" && "border-l-blue-500"
    )}>
      <CardContent className="p-6 space-y-4">
        {/* Header: Action Type & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {getActionIcon(actionType)}
            </div>
            <div>
              <Badge className="bg-primary/10 text-primary mb-1">
                {actionType}
              </Badge>
              {targetContacts && targetContacts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {targetContacts.length} {targetContacts.length === 1 ? 'Contact' : 'Contacts'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn(getStatusColor(status))}>
              {status.replace('_', ' ')}
            </Badge>
            <Badge className={cn(getPriorityColor(priority), "border")}>
              <Flag className="w-3 h-3 mr-1" />
              {priority}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{description}</p>
          {rationale && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Rationale:</span> {rationale}
              </p>
            </div>
          )}
        </div>

        {/* Footer: Expiration & Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {validUntil && (
              <>
                <Clock className="w-3 h-3" />
                <span>Valid until: {new Date(validUntil).toLocaleDateString()}</span>
              </>
            )}
          </div>

          {/* Action Buttons - Only show if not completed or skipped */}
          {!isCompleted && !isSkipped && (
            <div className="flex gap-2">
              {onSkip && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onSkip}
                >
                  Skip
                </Button>
              )}
              {onMarkComplete && (
                <Button 
                  size="sm"
                  onClick={onMarkComplete}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSignalBadgeColor, processSignals } from '@/lib/ContactUtils';
import { ContactSignal } from '@/app/api/contacts/route';
import { DrawerContactSignal } from '@/app/api/contacts/[id]/route';

interface SignalStateProps {
  signals: ContactSignal[] | DrawerContactSignal[];
  contactId: string;
  className?: string;
  showTooltips?: boolean;
  detailed?: boolean;
}

export const SignalState: React.FC<SignalStateProps> = ({ 
  signals, 
  contactId, 
  className = "",
  showTooltips = false,
  detailed = false
}) => {
  const processedSignals = processSignals(signals, detailed);

  if (processedSignals.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div className={`flex flex-wrap gap-1 max-w-full overflow-hidden ${className}`}>
      {processedSignals.map((signal, idx) => {
        const colorClass = getSignalBadgeColor(signal.key);
        
        if (showTooltips && detailed) {
          return (
            <Tooltip key={`${contactId}-${signal.type}-${idx}`}>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    "text-xs px-2 py-1 transition-colors cursor-help",
                    colorClass
                  )}
                >
                  {signal.key}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{signal.key}</p>
                  <p className="text-xs">Confidence: {Math.round(signal.score)}%</p>
                  {signal.description && (
                    <p className="text-xs text-gray-200">{signal.description}</p>
                  )}
                  {signal.source && (
                    <p className="text-xs text-gray-300">Source: {signal.source}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Badge
            key={`${contactId}-${signal.type}-${idx}`}
            className={cn(
              "text-xs px-1.5 py-0.5 whitespace-nowrap truncate",
              colorClass
            )}
            title={`${signal.key}: ${signal.score}`}
          >
            {signal.key}
          </Badge>
        );
      })}
    </div>
  );
};
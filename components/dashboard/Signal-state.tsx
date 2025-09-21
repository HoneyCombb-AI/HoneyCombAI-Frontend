import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSignalBadgeColor, processSignals } from '@/lib/ContactUtils';
import { ContactSignal } from '@/app/api/contacts/route';
import { DrawerContactSignal } from '@/app/api/contacts/[id]/route';
import { ExternalLink } from "lucide-react";
import getUrls from 'get-urls';

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
    <div
      className={`flex flex-wrap gap-1 max-w-full overflow-hidden ${className}`}
      data-testid="sample-contact-signals"
    >
      {processedSignals.map((signal, idx) => {
        const colorClass = getSignalBadgeColor(signal.key);
        const urls = signal.source ? Array.from(getUrls(signal.source)) : [];

        const SourceDisplay = () => {
          if (!signal.source) return null;

          if (urls.length === 0) {
            return <p className="text-xs">Source: {signal.source}</p>;
          }

          return (
            <div className="space-y-2 p-2">
              <div className="flex flex-wrap gap-4">
                {urls.map((url, urlIdx) => (
                  <button
                    key={urlIdx}
                    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                    className="text text-black hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Source {urlIdx + 1}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          );
        };

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
              <TooltipContent className="max-w-sm bg-amber-800/70 backdrop-blur-sm border border-amber-900/50 text-white">
                <div className="space-y-2">
                  <p className="font-bold">{signal.key}</p>
                  <p className="text-xs">Confidence: {Math.round(signal.score)}%</p>
                  {signal.description && (
                    <>
                      <p className="text-base text-left mb-3">{signal.description}</p>
                      <div className="border-t border-white"></div>
                    </>
                  )}
                  <SourceDisplay />
                  {signal.source_date && (
                    <p className="text-xs">Source Date: {signal.source_date}</p>
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
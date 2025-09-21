import React, { useMemo, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSignalBadgeColor, processSignals } from '@/lib/ContactUtils';
import { ContactSignal } from '@/app/api/contacts/route';
import { DrawerContactSignal } from '@/app/api/contacts/[id]/route';
import { ExternalLink } from "lucide-react";
import getUrls from 'get-urls';
import * as chrono from 'chrono-node';

interface SignalStateProps {
  signals: ContactSignal[] | DrawerContactSignal[];
  contactId: string;
  className?: string;
  showTooltips?: boolean;
  detailed?: boolean;
}

interface ProcessedSignal {
  key: string;
  score: number;
  type: string;
  description?: string;
  source?: string;
  source_date?: string;
  colorClass: string;
  urls: string[];
  parsedDate: Date | null;
  timeCategory: 'veryRecent' | 'recent' | 'older';
}

export const SignalState: React.FC<SignalStateProps> = ({
  signals,
  contactId,
  className = "",
  showTooltips = false,
  detailed = false
}) => {
  // Memoize time boundaries - only recalculate when component mounts or date changes
  const timeBoundaries = useMemo(() => {
    const now = new Date();
    return {
      threeMonthsAgo: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      oneYearAgo: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    };
  }, []);

  // Memoize processed signals with all computations done once
  const processedSignals: ProcessedSignal[] = useMemo(() => {
    const rawProcessed = processSignals(signals, detailed);

    return rawProcessed.map(signal => {
      const urls = signal.source ? Array.from(getUrls(signal.source)) : [];
      const parsedDate = signal.source_date ? chrono.parseDate(signal.source_date) : null;

      let timeCategory: 'veryRecent' | 'recent' | 'older' = 'older';
      if (parsedDate) {
        if (parsedDate >= timeBoundaries.threeMonthsAgo) {
          timeCategory = 'veryRecent';
        } else if (parsedDate >= timeBoundaries.oneYearAgo) {
          timeCategory = 'recent';
        }
      }

      return {
        ...signal,
        colorClass: getSignalBadgeColor(signal.key),
        urls,
        parsedDate,
        timeCategory
      };
    });
  }, [signals, detailed, timeBoundaries]);

  // Memoize grouped signals
  const groupedSignals = useMemo(() => {
    if (!showTooltips || !detailed) {
      return { ungrouped: processedSignals };
    }

    const veryRecent = processedSignals.filter(s => s.timeCategory === 'veryRecent');
    const recent = processedSignals.filter(s => s.timeCategory === 'recent');
    const older = processedSignals.filter(s => s.timeCategory === 'older');

    return { veryRecent, recent, older };
  }, [processedSignals, showTooltips, detailed]);

  // Early return if no signals
  if (processedSignals.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  // Memoized URL click handler to prevent recreating functions
  const handleUrlClick = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Memoized confidence bar class calculation
  const getConfidenceClass = useCallback((score: number) => {
    return score >= 80 ? 'bg-green-500' :
           score >= 60 ? 'bg-yellow-500' :
           score >= 40 ? 'bg-orange-500' : 'bg-red-400';
  }, []);

  // Optimized SourceDisplay component
  const SourceDisplay = useCallback(({ signal }: { signal: ProcessedSignal }) => {
    if (!signal.source) return null;

    if (signal.urls.length === 0) {
      return <p className="text-xs py-1 text-gray-100">Source: {signal.source}</p>;
    }

    return (
      <div className="space-y-2 p-2">
        <div className="flex flex-wrap gap-4">
          {signal.urls.map((url, urlIdx) => (
            <button
              key={urlIdx}
              onClick={() => handleUrlClick(url)}
              className="text text-black hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Source {urlIdx + 1}
              <ExternalLink className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>
    );
  }, [handleUrlClick]);

  // Optimized Signal Badge component
  const SignalBadge = useCallback(({ signal, idx, groupTitle }: {
    signal: ProcessedSignal;
    idx: number;
    groupTitle?: string;
  }) => {
    const signalKey = `${contactId}-${signal.type}-${idx}-${groupTitle || 'ungrouped'}`;

    if (showTooltips && detailed) {
      return (
        <Tooltip key={signalKey}>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                "text-xs px-2 py-1 transition-colors cursor-help",
                signal.colorClass
              )}
            >
              {signal.key}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm bg-amber-800/70 backdrop-blur-sm border border-amber-900/50 text-white">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-3">
                <p className="font-bold text-sm">{signal.key}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-100">Confidence</span>
                  <div className="w-16 h-2 bg-amber-900/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getConfidenceClass(signal.score)}`}
                      style={{ width: `${Math.round(signal.score)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white w-8">{Math.round(signal.score)}%</span>
                </div>
              </div>
              {signal.description && (
                <>
                  <p className="text-base text-left mb-4 text-white">{signal.description}</p>
                  <div className="border-t border-white"></div>
                </>
              )}
              <SourceDisplay signal={signal} />
              {/* {signal.source_date && (
                <p className="text-xs">Source Date: {signal.source_date}</p>
              )} */}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Badge
        key={signalKey}
        className={cn(
          "text-xs px-1.5 py-0.5 whitespace-nowrap truncate",
          signal.colorClass
        )}
        title={`${signal.key}: ${signal.score}`}
      >
        {signal.key}
      </Badge>
    );
  }, [contactId, showTooltips, detailed, getConfidenceClass, SourceDisplay]);

  // Optimized signal group renderer
  const renderSignalGroup = useCallback((signals: ProcessedSignal[], groupTitle?: string) => {
    return (
      <div key={groupTitle} className="space-y-4">
        {groupTitle && (
          <div className="text-xs font-semibold text-amber-800 border-b border-amber-700/30 pb-1">
            {groupTitle}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {signals.map((signal, idx) => (
            <SignalBadge
              key={`${signal.key}-${idx}-${groupTitle || 'ungrouped'}`}
              signal={signal}
              idx={idx}
              groupTitle={groupTitle}
            />
          ))}
        </div>
      </div>
    );
  }, [SignalBadge]);

  return (
    <div
      className={`flex flex-wrap gap-1 max-w-full overflow-hidden ${className}`}
      data-testid="sample-contact-signals"
    >
      {showTooltips && detailed ? (
        <div className="space-y-4 w-full">
          {groupedSignals.veryRecent && groupedSignals.veryRecent.length > 0 &&
            renderSignalGroup(groupedSignals.veryRecent, "Very Recent (< 3 months)")}
          {groupedSignals.recent && groupedSignals.recent.length > 0 &&
            renderSignalGroup(groupedSignals.recent, "Recent (3-12 months)")}
          {groupedSignals.older && groupedSignals.older.length > 0 &&
            renderSignalGroup(groupedSignals.older, "Older / No Date")}
        </div>
      ) : (
        groupedSignals.ungrouped?.map((signal, idx) => (
          <SignalBadge
            key={`${contactId}-${signal.type}-${idx}`}
            signal={signal}
            idx={idx}
          />
        ))
      )}
    </div>
  );
};
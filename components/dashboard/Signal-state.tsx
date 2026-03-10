import React, { useMemo, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSignalBadgeColor, processSignals } from '@/lib/ContactUtils';
import { ContactSignal, DrawerContactSignal } from '@/types/contacts';
import { ExternalLink } from "lucide-react";
import getUrls from 'get-urls';
import * as chrono from 'chrono-node';
import { useFontSize } from '@/lib/font-size-context';

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
  timeCategory: 'veryRecent' | 'recent' | 'other';
  is_custom?: boolean;
}

export const SignalState: React.FC<SignalStateProps> = ({
  signals,
  contactId,
  className = "",
  showTooltips = false,
  detailed = false
}) => {
  const { getFontSizeClass } = useFontSize();

  // All hooks must be called unconditionally at the top level
  const handleUrlClick = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);




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

  const SignalBadge = useCallback(({ signal, idx, groupTitle }: {
    signal: ProcessedSignal;
    idx: number;
    groupTitle?: string;
  }) => {
    const signalKey = `${contactId}-${signal.type}-${idx}-${groupTitle || 'ungrouped'}`;

    if (showTooltips && detailed) {
      return (
        <Tooltip key={signalKey} delayDuration={300}>
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
              <div className="flex items-center justify-between py-3 gap-3">
                <p className="font-bold text-sm">{signal.key}</p>
              </div>
              {signal.description && (
                <>
                  <p className={`${getFontSizeClass()} text-left mb-4 text-white`}>{signal.description}</p>
                  <div className="border-t border-white"></div>
                </>
              )}
              <SourceDisplay signal={signal} />
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
  }, [contactId, showTooltips, detailed, SourceDisplay, getFontSizeClass]);

  const renderSignalGroup = useCallback((
    signals: ProcessedSignal[],
    mainTitle?: string,
    description?: string
  ) => {
    const groupKey = mainTitle || 'ungrouped';

    return (
      <div key={groupKey} className="space-y-4">
        {mainTitle && (
          <div className="border-b border-green-700/30 pb-1">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-amber-800">
                {mainTitle}
              </span>
              {description && (
                <span className="text-xs text-gray-500">
                  {description}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {signals.map((signal, idx) => (
            <SignalBadge
              key={`${signal.key}-${idx}-${groupKey}`}
              signal={signal}
              idx={idx}
              groupTitle={mainTitle}
            />
          ))}
        </div>
      </div>
    );
  }, [SignalBadge]);

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

      let timeCategory: 'veryRecent' | 'recent' | 'other' = 'other';
      if (parsedDate) {
        if (parsedDate >= timeBoundaries.threeMonthsAgo) {
          timeCategory = 'veryRecent';
        } else if (parsedDate >= timeBoundaries.oneYearAgo) {
          timeCategory = 'recent';
        }
      }

      return {
        ...signal,
        colorClass: getSignalBadgeColor(signal.score, signal.key, signal.is_custom),
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
    const other = processedSignals.filter(s => s.timeCategory === 'other');

    return { veryRecent, recent, other };
  }, [processedSignals, showTooltips, detailed]);

  // Early return if no signals
  if (processedSignals.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div
      className={`flex flex-wrap gap-1 max-w-full overflow-hidden ${className}`}
      data-testid="sample-contact-signals"
    >
      {showTooltips && detailed ? (
        <div className="space-y-4 w-full">
          {groupedSignals.veryRecent && groupedSignals.veryRecent.length > 0 &&
            renderSignalGroup(groupedSignals.veryRecent, "Very Recent", "less than 3 months")}
          {groupedSignals.recent && groupedSignals.recent.length > 0 &&
            renderSignalGroup(groupedSignals.recent, "Recent", "3 to 12 months")}
          {groupedSignals.other && groupedSignals.other.length > 0 &&
            renderSignalGroup(groupedSignals.other, "Other")}
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
import { ContactSignal } from "@/app/api/contacts/route";


const generateSignalColor = (signalText: string): string => {
  // Glass-style color palette with light backgrounds and colored borders
  const colors = [
    "bg-blue-50 text-blue-700 border-blue-300",
    "bg-green-50 text-green-700 border-green-300",
    "bg-purple-50 text-purple-700 border-purple-300",
    "bg-indigo-50 text-indigo-700 border-indigo-300",
    "bg-pink-50 text-pink-700 border-pink-300",
    "bg-teal-50 text-teal-700 border-teal-300",
    "bg-orange-50 text-orange-700 border-orange-300",
    "bg-red-50 text-red-700 border-red-300",
    "bg-cyan-50 text-cyan-700 border-cyan-300",
    "bg-emerald-50 text-emerald-700 border-emerald-300",
    "bg-violet-50 text-violet-700 border-violet-300",
    "bg-rose-50 text-rose-700 border-rose-300",
    "bg-sky-50 text-sky-700 border-sky-300",
    "bg-amber-50 text-amber-700 border-amber-300",
    "bg-lime-50 text-lime-700 border-lime-300",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300"
  ];

  let hash = 0;
  const normalizedText = signalText.toLowerCase().trim();
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
};

export const getSignalBadgeColor = (scoreOrText: number | string, signalText?: string, isCustom?: boolean) => {
  if (isCustom) {
    return "bg-yellow-100 text-yellow-900 border-yellow-400 border-2 shadow-sm";
  }
  if (signalText) {
    return generateSignalColor(signalText);
  }
  if (typeof scoreOrText === 'string') {
    return generateSignalColor(scoreOrText);
  }
  return "bg-blue-50 text-blue-700 border-blue-300";
};


const normalizeSignalText = (text: string): string => {
  if (!text) return "";

  const normalized = text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return normalized;
};

export const processSignals = (signals: ContactSignal[] = [], showAll: boolean = false) => {
  if (!Array.isArray(signals)) return [];

  // Map signal types to display names
  const signalTypeMap: Record<string, string> = {
    'job_change': 'Job Change',
    'promotion': 'Promotion',
    'new_hiring': 'New Hiring',
    'company_news': 'Company News',
    'social_activity': 'Social Activity',
    'content_interaction': 'Content Interaction',
    'website_visit': 'Website Visit',
    'email_open': 'Email Open',
    'email_click': 'Email Click',
    'form_submission': 'Form Submission'
  };

  // Process each signal with backward compatibility
  const processedSignals = signals
    .map(signal => {
      const processedSignal: {
        key: string;
        score: number;
        type: string;
        description?: string;
        source?: string;
        source_date?: string;
        is_custom?: boolean;
      } = {
        key: signalTypeMap[signal.signal_type] || normalizeSignalText(signal.signal_type),
        score: signal.confidence_score,
        type: signal.signal_type
      };

      // Only include description, source, source_date, and is_custom if they exist (backward compatibility)
      if ('description' in signal && signal.description) {
        processedSignal.description = typeof signal.description === 'string' ? signal.description : undefined;
      }
      if ('source' in signal && signal.source) {
        processedSignal.source = typeof signal.source === 'string' ? signal.source : undefined;
      }
      if ('source_date' in signal && signal.source_date) {
        processedSignal.source_date = typeof signal.source_date === 'string' ? signal.source_date : undefined;
      }
      if ('is_custom' in signal) {
        processedSignal.is_custom = signal.is_custom;
      }

      return processedSignal;
    })
    .sort((a, b) => b.score - a.score);

  // Return all signals if showAll is true, otherwise slice to top 4
  return showAll ? processedSignals : processedSignals.slice(0, 4);
};

export const getActivityLevelBadgeColor = (activityScore: number): string => {
  if (activityScore >= 80) {
    return "bg-green-600 text-white"; // High activity
  } else if (activityScore >= 60) {
    return "bg-yellow-600 text-white"; // Medium activity
  } else if (activityScore >= 40) {
    return "bg-orange-600 text-white"; // Low-medium activity
  } else {
    return "bg-gray-600 text-white"; // Low activity
  }
};

export const formatTimeSpent = (minutes: number): string => {
  if (minutes === 0) return "";
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};



export const getSectionHeadingBadgeColor = (sectionName: string): string => {
  const headingColorMap: Record<string, string> = {
    // Main sections
    'social_intents': 'bg-gray-50/80 text-gray-700 border border-gray-200 font-semibold text-sm',
    'personal_information': 'bg-gray-50/80 text-gray-700 border border-gray-200 font-semibold text-sm',
    'social_nudges': 'bg-gray-50/80 text-gray-700 border border-gray-200 font-semibold text-sm',
    'social_activity': 'bg-gray-50/80 text-gray-700 border border-gray-200 font-semibold text-sm',
    'social_intelligence': 'bg-gray-50/80 text-gray-700 border border-gray-200 font-semibold text-sm',

    // AI Analysis sub-sections
    'account_overview': 'bg-cyan-50/80 text-cyan-700 border border-cyan-200 font-semibold text-sm',
    'contact_insights': 'bg-emerald-50/80 text-emerald-700 border border-emerald-200 font-semibold text-sm',
    'why_reach_out': 'bg-amber-50/80 text-amber-700 border border-amber-200 font-semibold text-sm',
    'final_assessment': 'bg-rose-50/80 text-rose-700 border border-rose-200 font-semibold text-sm',
    'strategic_recommendations': 'bg-violet-50/80 text-violet-700 border border-violet-200 font-semibold text-sm',
  };

  const normalizedKey = sectionName.toLowerCase().replace(/\s+/g, '_');
  return headingColorMap[normalizedKey] || 'bg-slate-50/80 text-slate-700 border border-slate-200 font-semibold text-sm';
};
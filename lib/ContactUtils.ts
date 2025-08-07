import { ContactSignal } from "@/app/api/contacts/route";


const generateSignalColor = (signalText: string): string => {
  // Professional color palette
  const colors = [
    "bg-blue-600 text-white",
    "bg-green-600 text-white", 
    "bg-purple-600 text-white",
    "bg-indigo-600 text-white",
    "bg-pink-600 text-white",
    "bg-teal-600 text-white",
    "bg-orange-600 text-white",
    "bg-red-600 text-white",
    "bg-cyan-600 text-white",
    "bg-emerald-600 text-white",
    "bg-violet-600 text-white",
    "bg-rose-600 text-white",
    "bg-sky-600 text-white",
    "bg-amber-600 text-white",
    "bg-lime-600 text-white",
    "bg-fuchsia-600 text-white"
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

export const getSignalBadgeColor = (scoreOrText: number | string, signalText?: string) => {
  if (signalText) {
    return generateSignalColor(signalText);
  }
  if (typeof scoreOrText === 'string') {
    return generateSignalColor(scoreOrText);
  }
  return "bg-blue-600 text-white";
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
      } = {
        key: signalTypeMap[signal.signal_type] || normalizeSignalText(signal.signal_type),
        score: signal.confidence_score,
        type: signal.signal_type
      };

      // Only include description and source if they exist (backward compatibility)
      if ('description' in signal && signal.description) {
        processedSignal.description = typeof signal.description === 'string' ? signal.description : undefined;
      }
      if ('source' in signal && signal.source) {
        processedSignal.source = typeof signal.source === 'string' ? signal.source : undefined;
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
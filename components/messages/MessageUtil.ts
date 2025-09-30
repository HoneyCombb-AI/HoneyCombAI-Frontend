
export interface ParsedSection {
  type: string;
  icon: string;
  content: string;
}

const iconMap: Record<string, string> = {
  'linkedin': 'linkedin',
  'email': 'email',
  'twitter': 'twitter',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'outreach': 'outreach'
};

export function parseBracketedText(input: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const regex = /\[([^\]]+)\]\s*([\s\S]*?)(?=\[|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const type = match[1].trim();
    const content = match[2].trim();

    if (content) {
      sections.push({
        type,
        icon: iconMap[type.toLowerCase()] || 'generic',
        content
      });
    }
  }

  return sections;
}
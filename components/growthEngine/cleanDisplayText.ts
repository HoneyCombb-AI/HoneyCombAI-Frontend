export const cleanDisplayText = (value?: string | null): string => {
  if (value === null || value === undefined) return "";
  const trimmed = value.toString().trim();
  if (!trimmed) return "";

  const cleaned = trimmed
    .replace(/\s*\[.*?\]\s*/g, " ") // Strip bracketed annotations like [Source: ...]
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || trimmed;
};

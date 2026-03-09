/**
 * Sanitizes text from AI responses to remove raw markdown, LaTeX, and HTML artifacts.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\times/g, "x")
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, "$1/$2")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\(?!n)/g, "");
}

/**
 * Security utility to escape HTML and prevent XSS attacks
 * Converts potentially dangerous HTML characters to their safe HTML entity equivalents
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * 
 * @param text - The text that may contain HTML characters
 * @returns The escaped text safe for rendering in HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}


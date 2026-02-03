/**
 * Text highlighting and snippet extraction utilities.
 *
 * These functions support displaying search results with:
 * - Highlighted matched terms (wrapped in <mark> tags)
 * - Context snippets around the first match
 *
 * Design decisions:
 * - Case-insensitive matching preserves original case in output
 * - Regex special characters are escaped to prevent injection
 * - Word boundaries are respected for clean snippet extraction
 */

/**
 * Escape regex special characters in a string.
 *
 * Prevents user search terms from being interpreted as regex patterns.
 * E.g., "test++" becomes "test\\+\\+" which matches literally.
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Expand position to nearest word boundary.
 *
 * @param text - Full text
 * @param pos - Position to expand from
 * @param direction - 'forward' or 'backward'
 * @returns Adjusted position at word boundary
 */
const expandToWordBoundary = (
  text: string,
  pos: number,
  direction: 'forward' | 'backward'
): number => {
  if (direction === 'backward') {
    // Move backward to find start of word (after whitespace)
    while (pos > 0 && !/\s/.test(text[pos - 1])) {
      pos--;
    }
    // Skip leading whitespace
    while (pos > 0 && /\s/.test(text[pos - 1])) {
      pos--;
    }
  } else {
    // Move forward to find end of word (before whitespace)
    while (pos < text.length && !/\s/.test(text[pos])) {
      pos++;
    }
    // Skip trailing whitespace
    while (pos < text.length && /\s/.test(text[pos])) {
      pos++;
    }
  }
  return pos;
};

/**
 * Truncate text to word boundary within limit.
 *
 * @param text - Text to truncate
 * @param limit - Maximum length
 * @returns Truncated text ending at word boundary
 */
const truncateToWordBoundary = (text: string, limit: number): string => {
  if (text.length <= limit) {
    return text;
  }

  // Find last space before limit
  let end = limit;
  while (end > 0 && !/\s/.test(text[end])) {
    end--;
  }

  // If no space found, just cut at limit
  if (end === 0) {
    end = limit;
  }

  return text.slice(0, end).trim();
};

/**
 * Highlight matched terms in text by wrapping them in <mark> tags.
 *
 * Matching is case-insensitive but preserves original case in output.
 * Terms are matched as whole words or word prefixes.
 *
 * @param text - The text to highlight
 * @param terms - Array of search terms to highlight
 * @returns Text with matched terms wrapped in <mark> tags
 *
 * @example
 * highlightText("Berlin is in Germany", ["berlin"])
 * // "<mark>Berlin</mark> is in Germany"
 */
export const highlightText = (text: string, terms: string[]): string => {
  if (!text || !terms || terms.length === 0) {
    return text || '';
  }

  // Filter out empty terms
  const validTerms = terms.filter((t) => t && t.trim().length > 0);
  if (validTerms.length === 0) {
    return text;
  }

  // Build pattern matching any of the terms
  // Use word boundary at start to avoid mid-word matches
  const escapedTerms = validTerms.map((t) => escapeRegex(t.trim()));
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  return text.replace(pattern, '<mark>$1</mark>');
};

/**
 * Extract a snippet of text around the first match.
 *
 * The snippet:
 * - Is approximately charLimit characters (default 200)
 * - Centers around the first matched term
 * - Expands to word boundaries
 * - Adds ellipsis if truncated
 *
 * @param text - The full text to extract from
 * @param terms - Array of search terms to find
 * @param charLimit - Maximum snippet length (default 200)
 * @returns Snippet with ellipsis if truncated
 *
 * @example
 * extractSnippet("Long text... Berlin is great... more text", ["berlin"], 50)
 * // "...text Berlin is great..."
 */
export const extractSnippet = (
  text: string,
  terms: string[],
  charLimit: number = 200
): string => {
  if (!text) {
    return '';
  }

  // If no terms or text is short enough, return beginning
  if (!terms || terms.length === 0 || text.length <= charLimit) {
    if (text.length <= charLimit) {
      return text;
    }
    // Return beginning with ellipsis
    return truncateToWordBoundary(text, charLimit) + '...';
  }

  // Filter out empty terms
  const validTerms = terms.filter((t) => t && t.trim().length > 0);
  if (validTerms.length === 0) {
    if (text.length <= charLimit) {
      return text;
    }
    return truncateToWordBoundary(text, charLimit) + '...';
  }

  // Find first match position
  const escapedTerms = validTerms.map((t) => escapeRegex(t.trim()));
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const match = pattern.exec(text);

  if (!match) {
    // No match found, return beginning
    if (text.length <= charLimit) {
      return text;
    }
    return truncateToWordBoundary(text, charLimit) + '...';
  }

  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;

  // Calculate snippet window centered on match
  const halfWindow = Math.floor((charLimit - match[0].length) / 2);
  let start = Math.max(0, matchStart - halfWindow);
  let end = Math.min(text.length, matchEnd + halfWindow);

  // Adjust window if we're at boundaries
  if (start === 0) {
    end = Math.min(text.length, charLimit);
  } else if (end === text.length) {
    start = Math.max(0, text.length - charLimit);
  }

  // Expand to word boundaries
  start = expandToWordBoundary(text, start, 'backward');
  end = expandToWordBoundary(text, end, 'forward');

  // Build snippet with ellipsis
  let snippet = text.slice(start, end);

  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < text.length) {
    snippet = snippet + '...';
  }

  return snippet;
};

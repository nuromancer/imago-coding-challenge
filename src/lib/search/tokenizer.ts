/**
 * Text tokenization for search indexing and query processing.
 *
 * This tokenizer is used during both index construction and query time.
 * Using the same tokenization ensures consistent matching.
 *
 * Key features:
 * - German umlaut normalization (via normalizeGerman)
 * - Stopword removal (German function words)
 * - Hyphenated word handling (index both whole and parts)
 * - Minimum token length (2 characters)
 * - Numbers preserved (for years, scores)
 */

import { GERMAN_STOPWORDS } from '@/lib/data/stopwords';
import { normalizeGerman } from '@/lib/data/preprocess';

/**
 * Tokenize text for search indexing or querying.
 *
 * Processing steps:
 * 1. Normalize German (lowercase + umlaut conversion)
 * 2. Split on whitespace and punctuation
 * 3. Handle hyphenated words (produce both combined and parts)
 * 4. Filter by minimum length (>= 2 chars)
 * 5. Remove stopwords
 *
 * @param text - Input text to tokenize
 * @returns Array of normalized tokens
 *
 * @example
 * tokenize("Der Munchen Politiker 2024")
 * // ["muenchen", "politiker", "2024"]
 *
 * @example
 * tokenize("Baden-Wurttemberg")
 * // ["baden-wuerttemberg", "baden", "wuerttemberg"]
 */
export const tokenize = (text: string): string[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Step 1: Normalize German (lowercase + umlauts)
  const normalized = normalizeGerman(text);

  // Step 2: Find all tokens including hyphenated words
  const tokens: string[] = [];

  // Split by non-alphanumeric except hyphens first to find potential hyphenated words
  const words = normalized.split(/[\s,.;:!?"'()[\]{}]+/).filter(Boolean);

  for (const word of words) {
    // Check if this is a hyphenated word
    if (word.includes('-')) {
      const parts = word.split('-').filter(p => p.length >= 2);

      if (parts.length >= 2) {
        // Add the whole hyphenated word
        if (word.length >= 2) {
          tokens.push(word);
        }
        // Add individual parts
        tokens.push(...parts);
      } else {
        // Single part or short parts - just add what we can
        if (word.length >= 2) {
          tokens.push(word.replace(/-/g, ''));
        }
      }
    } else {
      // Regular word
      if (word.length >= 2) {
        tokens.push(word);
      }
    }
  }

  // Step 3: Remove stopwords
  const filtered = tokens.filter(token => !GERMAN_STOPWORDS.has(token));

  return filtered;
};

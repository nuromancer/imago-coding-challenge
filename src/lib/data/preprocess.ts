/**
 * Preprocessing utilities for media item normalization.
 *
 * These functions transform raw media items with inconsistent formats
 * into normalized items suitable for search indexing.
 *
 * Key preprocessing steps:
 * 1. Extract restriction tokens BEFORE any other processing
 * 2. Normalize German umlauts to ASCII equivalents
 * 3. Parse various date formats to ISO
 * 4. Lowercase and clean text for case-insensitive search
 */

import type { RawMediaItem, ProcessedMediaItem } from './types';

/**
 * Regex pattern to match restriction tokens.
 * These are uppercase words joined by 'x' (e.g., PUBLICATIONxINxGERxONLY).
 * Must be extracted before tokenization or the 'x' delimiters fragment them.
 */
const RESTRICTION_PATTERN = /[A-Z]+(?:x[A-Z]+)+/g;

/**
 * Normalize German text for search indexing.
 *
 * - Converts to lowercase
 * - Replaces German umlauts with ASCII equivalents:
 *   - ä -> ae
 *   - ö -> oe
 *   - ü -> ue
 *   - ß -> ss
 *
 * Note: Only handles specific umlaut characters, not all diacritics.
 * This matches the standard German transliteration scheme.
 *
 * @param text - Input text (may contain German umlauts)
 * @returns Normalized lowercase text with umlauts converted
 *
 * @example
 * normalizeGerman("Munchen") // "muenchen"
 * normalizeGerman("Strasse") // "strasse"
 * normalizeGerman("Ubung")   // "uebung"
 */
export const normalizeGerman = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
};

/**
 * Parse various date formats into ISO format (YYYY-MM-DD).
 *
 * Supported formats:
 * - DD.MM.YYYY (European with dots)
 * - DD/MM/YYYY (European with slashes)
 * - YYYY-MM-DD (already ISO)
 *
 * Uses explicit regex parsing instead of Date constructor
 * because JS Date parsing of non-ISO formats is unreliable.
 *
 * @param dateStr - Input date string in any supported format
 * @returns ISO date string (YYYY-MM-DD) or null if format not recognized
 *
 * @example
 * parseDate("14.03.2024")  // "2024-03-14"
 * parseDate("14/03/2024")  // "2024-03-14"
 * parseDate("2024-03-14")  // "2024-03-14"
 * parseDate("invalid")     // null
 */
export const parseDate = (dateStr: string): string | null => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const trimmed = dateStr.trim();

  // Try DD.MM.YYYY (European with dots)
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try DD/MM/YYYY (European with slashes)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Already ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Unknown format
  return null;
};

/**
 * Extract restriction tokens from text.
 *
 * Restriction tokens are uppercase words joined by 'x' that indicate
 * publication restrictions (e.g., PUBLICATIONxINxGERxSUIxAUTxONLY).
 *
 * These must be extracted BEFORE tokenization because:
 * 1. The 'x' delimiter would fragment them during tokenization
 * 2. They're needed as filterable values, not search terms
 *
 * @param text - Input text that may contain restriction tokens
 * @returns Object with:
 *   - restrictions: Array of extracted restriction tokens
 *   - cleanText: Original text with restrictions removed
 *
 * @example
 * extractRestrictions("Berlin PUBLICATIONxINxGERxONLY test")
 * // { restrictions: ["PUBLICATIONxINxGERxONLY"], cleanText: "Berlin test" }
 */
export const extractRestrictions = (text: string): {
  restrictions: string[];
  cleanText: string;
} => {
  if (!text || typeof text !== 'string') {
    return { restrictions: [], cleanText: text || '' };
  }

  const restrictions = text.match(RESTRICTION_PATTERN) || [];
  const cleanText = text
    .replace(RESTRICTION_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { restrictions, cleanText };
};

/**
 * Process a raw media item into a normalized item for search indexing.
 *
 * Orchestrates all preprocessing steps:
 * 1. Extracts restriction tokens from suchtext
 * 2. Normalizes the remaining suchtext for search
 * 3. Parses datum to ISO format
 * 4. Normalizes fotografen for search
 *
 * Preserves original raw fields for display while adding computed fields.
 *
 * @param raw - Raw media item with potentially dirty data
 * @returns Processed media item with normalized fields
 *
 * @example
 * preprocessItem({
 *   bildnummer: "abc-123",
 *   suchtext: "Munchen PUBLICATIONxINxGERxONLY",
 *   fotografen: "IMAGO / Muller",
 *   datum: "14.03.2024",
 *   hoehe: 800,
 *   breite: 1200
 * })
 * // {
 * //   ...raw,
 * //   dateISO: "2024-03-14",
 * //   searchableText: "muenchen",
 * //   restrictions: ["PUBLICATIONxINxGERxONLY"],
 * //   photographerNormalized: "imago / mueller"
 * // }
 */
export const preprocessItem = (raw: RawMediaItem): ProcessedMediaItem => {
  // Step 1: Extract restrictions BEFORE any other processing
  const { restrictions, cleanText } = extractRestrictions(raw.suchtext);

  // Step 2: Normalize the clean text for search
  const searchableText = normalizeGerman(cleanText);

  // Step 3: Parse date (use raw value if parsing fails)
  const parsedDate = parseDate(raw.datum);
  const dateISO = parsedDate || raw.datum;

  // Step 4: Normalize photographer for search
  const photographerNormalized = normalizeGerman(raw.fotografen);

  return {
    // Preserve original raw fields
    ...raw,
    // Add computed fields
    dateISO,
    searchableText,
    restrictions,
    photographerNormalized,
  };
};

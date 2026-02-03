/**
 * Type definitions for media items in the IMAGO search system.
 *
 * Two interfaces exist:
 * - RawMediaItem: Original data as generated (dirty dates, umlauts, embedded restrictions)
 * - ProcessedMediaItem: Normalized data ready for indexing (ISO dates, normalized text)
 */

/**
 * Raw media item as it comes from the data source.
 * Contains German field names matching the challenge spec.
 * May have inconsistent formats (dates, umlauts, restrictions embedded in text).
 */
export interface RawMediaItem {
  /** Unique identifier (UUID format) */
  bildnummer: string;

  /** Search text - keyword-style metadata (not sentences) */
  suchtext: string;

  /** Photographer/source in format "IMAGO / [source]" */
  fotografen: string;

  /** Date - may be DD.MM.YYYY, DD/MM/YYYY, or ISO format */
  datum: string;

  /** Image height in pixels */
  hoehe: number;

  /** Image width in pixels */
  breite: number;
}

/**
 * Processed media item with normalized fields for search.
 * Extends RawMediaItem to keep original values for display.
 * Adds computed fields for search indexing.
 */
export interface ProcessedMediaItem extends RawMediaItem {
  /** Normalized date in ISO format (YYYY-MM-DD) */
  dateISO: string;

  /**
   * Normalized search text:
   * - Lowercased
   * - Umlauts converted (ae/oe/ue/ss)
   * - Restriction tokens removed (extracted to restrictions[])
   */
  searchableText: string;

  /**
   * Extracted restriction tokens (e.g., PUBLICATIONxINxGERxONLY).
   * Extracted from suchtext before tokenization to preserve them intact.
   */
  restrictions: string[];

  /** Normalized photographer name (lowercased, umlauts converted) */
  photographerNormalized: string;
}

/**
 * Type definitions for the inverted index search system.
 *
 * These interfaces define the data structures needed for:
 * - Term postings (which documents contain a term and how often)
 * - Field indices (separate index per searchable field)
 * - BM25 scoring metadata (document lengths, averages)
 * - Search results with relevance scores
 */

import type { ProcessedMediaItem } from '@/lib/data/types';

// Re-export ProcessedMediaItem for convenience
export type { ProcessedMediaItem };

/**
 * A posting represents a single occurrence of a term in a document.
 * Stores the document ID and term frequency for BM25 scoring.
 */
export interface Posting {
  /** Document ID (index into the documents array) */
  docId: number;

  /** Number of times this term appears in the document */
  termFrequency: number;
}

/**
 * Index structure for a single field (suchtext or fotografen).
 * Contains all data needed for BM25 scoring on this field.
 *
 * Separate field indices allow for field-specific weighting
 * (e.g., suchtext matches rank higher than fotografen-only).
 */
export interface FieldIndex {
  /**
   * Map from term to list of postings.
   * Each posting contains docId and term frequency.
   *
   * Example: "berlin" -> [{docId: 5, tf: 2}, {docId: 42, tf: 1}]
   */
  termPostings: Map<string, Posting[]>;

  /**
   * Map from docId to document length (number of tokens in this field).
   * Needed for BM25 length normalization.
   */
  docLengths: Map<number, number>;

  /** Total number of documents indexed in this field */
  totalDocs: number;

  /**
   * Average document length across all documents.
   * Calculated after all documents are added (finalizeIndex).
   * Used in BM25 length normalization formula.
   */
  avgDocLength: number;
}

/**
 * A search result with relevance score.
 */
export interface SearchResult {
  /** Document ID (index into documents array) */
  docId: number;

  /** The matched document */
  item: ProcessedMediaItem;

  /** Combined BM25 score across all fields */
  score: number;

  /** Terms that matched (for highlighting) */
  matchedTerms: string[];
}

/**
 * Search configuration parameters.
 */
export interface SearchConfig {
  /** BM25 k1 parameter (term frequency saturation) */
  k1: number;

  /** BM25 b parameter (length normalization) */
  b: number;

  /** Weight multiplier for suchtext field */
  suchtextWeight: number;

  /** Weight multiplier for fotografen field */
  fotografenWeight: number;

  /** Weight multiplier for bildnummer field */
  bildnummerWeight: number;

  /** Minimum characters for prefix expansion */
  minPrefixLength: number;

  /** Maximum terms to expand for prefix matching */
  maxPrefixExpansion: number;

  /** Score penalty for prefix matches (0-1) */
  prefixPenalty: number;
}

/**
 * Default search configuration.
 *
 * - k1=1.2, b=0.75: Standard BM25 parameters
 * - suchtext 3x weight: Primary search field (descriptions)
 * - fotografen 1.5x weight: Secondary field (photographer names)
 * - bildnummer 1x weight: ID field (optional lookup)
 * - 3 char minimum for prefix: Avoid explosion from short prefixes
 * - 50 term max expansion: Limit prefix expansion for performance
 * - 0.8 prefix penalty: Slight penalty for non-exact matches
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  k1: 1.2,
  b: 0.75,
  suchtextWeight: 3.0,
  fotografenWeight: 1.5,
  bildnummerWeight: 1.0,
  minPrefixLength: 3,
  maxPrefixExpansion: 50,
  prefixPenalty: 0.8,
};

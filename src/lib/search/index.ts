/**
 * Search module public API.
 *
 * This module provides the singleton searchIndex instance that is built
 * at module load time. The index persists across warm invocations in
 * Vercel serverless, making search O(1) for term lookup.
 *
 * Usage:
 * import { searchIndex, getPhotographers, getRestrictions } from '@/lib/search';
 *
 * The index is built automatically when this module is first imported.
 * Subsequent imports reuse the same instance (module-scope singleton).
 */

import mediaItems from '../../../data/media-items.json';
import { InvertedIndex } from './inverted-index';
import type { ProcessedMediaItem } from '@/lib/data/types';

// Re-export types for convenience
export type {
  Posting,
  FieldIndex,
  ProcessedMediaItem,
  SearchResult,
  SearchConfig,
} from './types';
export { DEFAULT_SEARCH_CONFIG } from './types';
export { InvertedIndex } from './inverted-index';
export { tokenize } from './tokenizer';

// Import search function from searcher (to wrap with bound index)
import { search as searchFn } from './searcher';

/**
 * Module-scope singleton index.
 *
 * Built once at module load time (cold start).
 * Persists across warm invocations in serverless.
 * Expected build time: <200ms for 10k items.
 */
const searchIndex = new InvertedIndex();

// Build index at module load time
console.time('Index build');
(mediaItems as ProcessedMediaItem[]).forEach((item, idx) =>
  searchIndex.addDocument(idx, item)
);
searchIndex.finalizeIndex();
console.timeEnd('Index build');
console.log(`Indexed ${mediaItems.length} documents`);

/**
 * The singleton search index instance.
 *
 * Contains all 10k documents indexed by suchtext and fotografen fields.
 * Ready for term lookup and BM25 scoring.
 */
export { searchIndex };

/**
 * Execute a search query against the index.
 *
 * Convenience wrapper that binds searchFn to the singleton searchIndex.
 *
 * @param query - User query string
 * @param config - Optional search configuration overrides
 * @returns Array of SearchResult sorted by BM25 score
 *
 * @example
 * import { search } from '@/lib/search';
 * const results = search('berlin');
 */
export const search = (
  query: string,
  config?: Partial<import('./types').SearchConfig>
) => searchFn(query, searchIndex, config);

/**
 * Get distinct photographers for filter dropdown.
 *
 * Returns sorted list of original fotografen values (not normalized).
 * Convenience wrapper around searchIndex.getPhotographers().
 *
 * @returns Sorted array of photographer names
 */
export const getPhotographers = (): string[] => {
  return searchIndex.getPhotographers();
};

/**
 * Get distinct restrictions for filter dropdown.
 *
 * Returns sorted list of restriction tokens (e.g., PUBLICATIONxINxGERxONLY).
 * Convenience wrapper around searchIndex.getRestrictions().
 *
 * @returns Sorted array of restriction tokens
 */
export const getRestrictions = (): string[] => {
  return searchIndex.getRestrictions();
};

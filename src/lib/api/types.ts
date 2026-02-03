/**
 * API type definitions for the IMAGO search system.
 *
 * These types define the request/response shapes for the search and filters
 * API endpoints. They extend the internal ProcessedMediaItem type with
 * API-specific fields like scores and snippets.
 */

import type { ProcessedMediaItem } from '@/lib/data/types';

/**
 * Search query parameters accepted by GET /api/search.
 *
 * All parameters are optional. Empty query returns all items (browse mode).
 */
export interface SearchParams {
  /** Search query string */
  q?: string;

  /** Page number (1-indexed, default: 1) */
  page?: number;

  /** Results per page (default: 20, max: 100) */
  pageSize?: number;

  /** Filter by photographer (exact match) */
  credit?: string;

  /** Filter by date range lower bound (ISO date, inclusive) */
  dateFrom?: string;

  /** Filter by date range upper bound (ISO date, inclusive) */
  dateTo?: string;

  /** Filter by restrictions (OR logic between values) */
  restriction?: string[];

  /** Sort order by date ('asc' or 'desc') */
  sort?: 'asc' | 'desc';
}

/**
 * A search result item with score and highlighted snippet.
 *
 * Extends ProcessedMediaItem with API-specific fields for display.
 */
export interface SearchResult extends ProcessedMediaItem {
  /** BM25 relevance score (0 for browse mode) */
  score: number;

  /** Plain text snippet around first match (~200 chars) */
  snippet: string;

  /** Snippet with matched terms wrapped in <mark> tags */
  highlightedSnippet: string;
}

/**
 * Response shape for GET /api/search.
 *
 * Contains paginated results with metadata for UI rendering.
 */
export interface SearchResponse {
  /** Array of search results for current page */
  items: SearchResult[];

  /** Current page number (1-indexed) */
  page: number;

  /** Results per page */
  pageSize: number;

  /** Total number of matching results (before pagination) */
  total: number;

  /** Total number of pages */
  totalPages: number;

  /** Query execution time in milliseconds */
  queryTimeMs: number;
}

/**
 * Response shape for GET /api/filters.
 *
 * Contains filter options for UI dropdowns.
 */
export interface FiltersResponse {
  /** Sorted list of distinct photographer names */
  credits: string[];

  /** Sorted list of restrictions, with 'none' first */
  restrictions: string[];

  /** Date range of all documents */
  dateRange: {
    /** Earliest date (ISO format) */
    min: string;
    /** Latest date (ISO format) */
    max: string;
  };
}

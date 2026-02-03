/**
 * Search API endpoint.
 *
 * GET /api/search - Query the BM25 search index with filtering and pagination.
 *
 * Query parameters:
 * - q: Search query (empty = browse mode, returns all items)
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 20, max: 100)
 * - credit: Filter by photographer (exact match)
 * - dateFrom: Filter by date range start (ISO date, inclusive)
 * - dateTo: Filter by date range end (ISO date, inclusive)
 * - restriction: Filter by restriction (can appear multiple times, OR logic)
 * - sort: Sort by date ('asc' or 'desc')
 *
 * Response: SearchResponse with paginated, highlighted results
 */

import { NextRequest, NextResponse } from 'next/server';
import { search, searchIndex } from '@/lib/search';
import { highlightText, extractSnippet } from '@/lib/api/highlight';
import { logQuery } from '@/lib/api/analytics';
import type { SearchResponse, SearchResult } from '@/lib/api/types';
import type { ProcessedMediaItem } from '@/lib/data/types';

/**
 * Parse and validate page number.
 */
const parsePage = (value: string | null): number => {
  if (!value) return 1;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

/**
 * Parse and validate page size.
 */
const parsePageSize = (value: string | null): number => {
  if (!value) return 20;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 100);
};

/**
 * Parse sort parameter.
 */
const parseSort = (value: string | null): 'asc' | 'desc' | undefined => {
  if (value === 'asc' || value === 'desc') return value;
  return undefined;
};

/**
 * Apply filters to results.
 *
 * Filters are AND between types, OR within restriction array.
 */
const applyFilters = (
  items: Array<{ item: ProcessedMediaItem; score: number; matchedTerms: string[] }>,
  credit: string | null,
  dateFrom: string | null,
  dateTo: string | null,
  restrictions: string[]
): Array<{ item: ProcessedMediaItem; score: number; matchedTerms: string[] }> => {
  return items.filter(({ item }) => {
    // Credit filter: exact match on fotografen
    if (credit && item.fotografen !== credit) {
      return false;
    }

    // Date range filter: inclusive bounds on dateISO
    if (dateFrom && item.dateISO && item.dateISO < dateFrom) {
      return false;
    }
    if (dateTo && item.dateISO && item.dateISO > dateTo) {
      return false;
    }

    // Restriction filter: OR logic
    // 'none' matches items with empty restrictions array
    if (restrictions.length > 0) {
      const hasNone = restrictions.includes('none');
      const otherRestrictions = restrictions.filter((r) => r !== 'none');

      // Match if:
      // 1. 'none' is selected AND item has no restrictions, OR
      // 2. Item has ANY of the selected restrictions
      const matchesNone = hasNone && item.restrictions.length === 0;
      const matchesOther = otherRestrictions.some((r) =>
        item.restrictions.includes(r)
      );

      if (!matchesNone && !matchesOther) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort results by date.
 */
const sortByDate = (
  items: Array<{ item: ProcessedMediaItem; score: number; matchedTerms: string[] }>,
  order: 'asc' | 'desc'
): Array<{ item: ProcessedMediaItem; score: number; matchedTerms: string[] }> => {
  return [...items].sort((a, b) => {
    const dateA = a.item.dateISO || '';
    const dateB = b.item.dateISO || '';
    const comparison = dateA.localeCompare(dateB);
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Transform internal results to API response format.
 */
const transformResults = (
  items: Array<{ item: ProcessedMediaItem; score: number; matchedTerms: string[] }>
): SearchResult[] => {
  return items.map(({ item, score, matchedTerms }) => {
    const snippet = extractSnippet(item.suchtext, matchedTerms, 200);
    const highlightedSnippet = highlightText(snippet, matchedTerms);

    return {
      ...item,
      score,
      snippet,
      highlightedSnippet,
    };
  });
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const startTime = performance.now();

  try {
    const params = request.nextUrl.searchParams;

    // Parse query parameters
    const q = params.get('q') || '';
    const page = parsePage(params.get('page'));
    const pageSize = parsePageSize(params.get('pageSize'));
    const credit = params.get('credit');
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');
    const restrictions = params.getAll('restriction');
    const sort = parseSort(params.get('sort'));

    // Execute search or get all documents
    let results: Array<{
      item: ProcessedMediaItem;
      score: number;
      matchedTerms: string[];
    }>;

    if (q.trim()) {
      // Query mode: use BM25 search
      const searchResults = search(q);
      results = searchResults.map((r) => ({
        item: r.item,
        score: r.score,
        matchedTerms: r.matchedTerms,
      }));
    } else {
      // Browse mode: get all documents
      const allDocs = searchIndex.getAllDocuments();
      results = allDocs.map((item) => ({
        item,
        score: 0,
        matchedTerms: [],
      }));
    }

    // Apply filters
    results = applyFilters(results, credit, dateFrom, dateTo, restrictions);

    // Apply sorting
    if (sort) {
      // Explicit sort requested
      results = sortByDate(results, sort);
    } else if (!q.trim()) {
      // Browse mode with no explicit sort: default to newest first
      results = sortByDate(results, 'desc');
    }
    // else: query mode with no explicit sort - keep BM25 relevance order

    // Calculate pagination
    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Paginate
    const paginatedResults = results.slice(startIndex, endIndex);

    // Transform to API response format
    const items = transformResults(paginatedResults);

    const queryTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Log query for analytics
    logQuery({
      query: q,
      resultCount: total,
      responseTimeMs: queryTimeMs,
      timestamp: Date.now(),
    });

    const response: SearchResponse = {
      items,
      page,
      pageSize,
      total,
      totalPages,
      queryTimeMs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
};

/**
 * Filters API endpoint.
 *
 * GET /api/filters - Get available filter options for the search UI.
 *
 * Returns:
 * - credits: Sorted list of distinct photographers
 * - restrictions: Sorted list of restrictions, with 'none' first
 * - dateRange: Min and max dates from all documents
 *
 * These values are derived from the search index and cached in memory.
 */

import { NextResponse } from 'next/server';
import { getPhotographers, getRestrictions, searchIndex } from '@/lib/search';
import type { FiltersResponse } from '@/lib/api/types';

/**
 * Calculate date range from all documents.
 *
 * Extracts min and max dateISO values from the index.
 * Empty dates are filtered out.
 */
const calculateDateRange = (): { min: string; max: string } => {
  const documents = searchIndex.getAllDocuments();
  const dates = documents
    .map((doc) => doc.dateISO)
    .filter((d) => d && d.length > 0)
    .sort();

  if (dates.length === 0) {
    return { min: '', max: '' };
  }

  return {
    min: dates[0],
    max: dates[dates.length - 1],
  };
};

export const GET = async (): Promise<NextResponse> => {
  try {
    // Get photographers (sorted alphabetically)
    const credits = getPhotographers();

    // Get restrictions with 'none' as first option
    const rawRestrictions = getRestrictions();
    const restrictions = ['none', ...rawRestrictions];

    // Calculate date range
    const dateRange = calculateDateRange();

    const response: FiltersResponse = {
      credits,
      restrictions,
      dateRange,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Filters API error:', error);
    return NextResponse.json(
      { error: 'Failed to get filters' },
      { status: 500 }
    );
  }
};

'use client';

import type { FC } from 'react';
import type { SearchResult } from '@/lib/api/types';
import { ResultRow } from './ResultRow';

interface ResultsListProps {
  /** Array of search results to display */
  items: SearchResult[];
  /** Total number of results (may be more than items.length due to pagination) */
  total: number;
  /** Current search query for context display */
  query?: string;
}

/**
 * Results list container with count header and zebra striping (dark mode).
 *
 * Displays result count and maps over items to render ResultRow components.
 */
export const ResultsList: FC<ResultsListProps> = ({ items, total, query }) => {
  return (
    <div className="w-full">
      {/* Result count header */}
      <div className="mb-4 text-sm text-gray-400">
        <span className="font-medium text-gray-300">{total.toLocaleString()}</span> results
        {query && (
          <span>
            {' '}
            for &apos;<span className="font-medium text-gray-300">{query}</span>&apos;
          </span>
        )}
      </div>

      {/* Results list with zebra striping */}
      <div className="divide-y divide-gray-700/50 rounded-lg border border-gray-700 bg-gray-800">
        {items.map((item, index) => (
          <div
            key={item.bildnummer}
            className={index % 2 === 1 ? 'bg-gray-800/50' : ''}
          >
            <ResultRow item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

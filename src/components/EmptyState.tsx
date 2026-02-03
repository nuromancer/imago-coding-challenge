'use client';

import type { FC } from 'react';

interface EmptyStateProps {
  /** Optional search query to display in message */
  query?: string;
}

/**
 * Displayed when search returns no results (dark mode).
 *
 * Shows a contextual message based on whether there was a search query.
 * Provides suggestions for finding results.
 */
export const EmptyState: FC<EmptyStateProps> = ({ query }) => {
  return (
    <div className="py-12 text-center">
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="mb-2 text-lg font-medium text-gray-200">
        {query ? `No results found for "${query}"` : 'No items found'}
      </h3>

      {/* Suggestion */}
      <p className="text-sm text-gray-500">
        Try adjusting your search or filters
      </p>
    </div>
  );
};

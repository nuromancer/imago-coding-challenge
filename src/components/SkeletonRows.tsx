'use client';

import type { FC } from 'react';

interface SkeletonRowsProps {
  /** Number of skeleton rows to display (default: 5) */
  count?: number;
}

/**
 * Loading placeholder that mimics the ResultRow structure (dark mode).
 *
 * Uses animate-pulse for a subtle loading animation.
 * Accessible with role="status" for screen readers.
 */
export const SkeletonRows: FC<SkeletonRowsProps> = ({ count = 5 }) => {
  return (
    <div role="status" aria-label="Loading results" className="animate-pulse">
      <div className="rounded-lg border border-gray-700 bg-gray-800">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex gap-3 px-4 py-2.5 border-b border-gray-700/50 last:border-b-0">
            {/* Thumbnail placeholder - matches ResultRow 56px square */}
            <div className="w-14 h-14 bg-gray-700 rounded flex-shrink-0" />

            {/* Content placeholder */}
            <div className="flex-1 flex flex-col gap-1.5 py-0.5">
              {/* Title placeholder - 3/4 width */}
              <div className="h-4 bg-gray-700 rounded w-3/4" />

              {/* Metadata row */}
              <div className="flex gap-3">
                <div className="h-3 bg-gray-700 rounded w-16" />
                <div className="h-3 bg-gray-700 rounded w-20" />
                <div className="h-3 bg-gray-700 rounded w-24" />
                <div className="h-3 bg-gray-700 rounded w-20" />
              </div>

              {/* Restriction badges placeholder */}
              <div className="flex gap-2 pt-0.5">
                <div className="h-4 bg-gray-700 rounded-full w-20" />
                <div className="h-4 bg-gray-700 rounded-full w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

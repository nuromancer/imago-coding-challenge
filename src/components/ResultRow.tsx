'use client';

import type { FC } from 'react';
import type { SearchResult } from '@/lib/api/types';

interface ResultRowProps {
  /** Search result item to display */
  item: SearchResult;
}

/**
 * Get a consistent color class for a restriction type (dark mode).
 * Uses a hash-based approach to ensure every restriction gets a distinct, consistent color.
 */
const getRestrictionColor = (restriction: string): string => {
  // Color palette for restrictions (dark mode friendly)
  const colors = [
    'bg-blue-900/50 text-blue-300',
    'bg-green-900/50 text-green-300',
    'bg-purple-900/50 text-purple-300',
    'bg-orange-900/50 text-orange-300',
    'bg-pink-900/50 text-pink-300',
    'bg-yellow-900/50 text-yellow-300',
    'bg-cyan-900/50 text-cyan-300',
    'bg-red-900/50 text-red-300',
    'bg-indigo-900/50 text-indigo-300',
    'bg-teal-900/50 text-teal-300',
  ];

  // Simple hash function to get consistent index from string
  let hash = 0;
  for (let i = 0; i < restriction.length; i++) {
    hash = ((hash << 5) - hash + restriction.charCodeAt(i)) | 0;
  }

  // Use absolute value and modulo to get a valid index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Format an ISO date string to German locale (DD.MM.YYYY).
 */
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('de-DE');
};

/**
 * Single result row displaying media item metadata.
 *
 * Shows thumbnail placeholder, title with highlighting, date, credit,
 * bildnummer, dimensions, score badge, and restriction badges.
 */
export const ResultRow: FC<ResultRowProps> = ({ item }) => {
  return (
    <div className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-gray-700/50">
      {/* Thumbnail placeholder */}
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-gray-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Title with highlighting */}
        <h3
          className="line-clamp-1 text-sm font-medium text-gray-100 [&>mark]:bg-yellow-500/40 [&>mark]:text-yellow-200"
          dangerouslySetInnerHTML={{ __html: item.highlightedSnippet }}
        />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
          <span className="font-mono text-gray-500">{item.bildnummer}</span>
          <span>{formatDate(item.dateISO)}</span>
          <span>{item.fotografen}</span>
          <span>{item.breite} x {item.hoehe} px</span>
          {item.score > 0 && (
            <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs font-medium text-gray-300">
              Score: {item.score.toFixed(2)}
            </span>
          )}
        </div>

        {/* Restriction badges */}
        {item.restrictions.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {item.restrictions.map((restriction) => (
              <span
                key={restriction}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRestrictionColor(restriction)}`}
              >
                {restriction}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import type { FC } from 'react';

type SortOrder = 'asc' | 'desc' | null;

interface SortControlProps {
  /** Current sort order: 'asc', 'desc', or null (relevance) */
  sort: SortOrder;
  /** Callback when sort order changes */
  onChange: (sort: SortOrder) => void;
}

/**
 * Get the next sort state in the cycle: asc -> desc -> null -> asc
 */
const getNextSort = (current: SortOrder): SortOrder => {
  switch (current) {
    case 'asc':
      return 'desc';
    case 'desc':
      return null;
    case null:
    default:
      return 'asc';
  }
};

/**
 * Get display label and icon for sort state
 */
const getSortDisplay = (sort: SortOrder): { label: string; icon: string } => {
  switch (sort) {
    case 'asc':
      return { label: 'Date', icon: '↑' };
    case 'desc':
      return { label: 'Date', icon: '↓' };
    case null:
    default:
      return { label: 'Relevance', icon: '○' };
  }
};

/**
 * Toggle button for sorting search results (dark mode).
 *
 * Cycles through three states:
 * - asc: Sort by date ascending (oldest first)
 * - desc: Sort by date descending (newest first)
 * - null: Sort by relevance (BM25 score)
 */
export const SortControl: FC<SortControlProps> = ({ sort, onChange }) => {
  const { label, icon } = getSortDisplay(sort);

  const handleClick = () => {
    onChange(getNextSort(sort));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      aria-label={`Sort by ${label}${sort ? ` (${sort === 'asc' ? 'ascending' : 'descending'})` : ''}`}
    >
      <span>Sort: {label}</span>
      <span className="text-lg">{icon}</span>
    </button>
  );
};

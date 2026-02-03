'use client';

import type { FC } from 'react';

interface ActiveFiltersProps {
  /** Currently selected credit filter */
  credit: string;
  /** Callback to clear credit filter */
  onClearCredit: () => void;
  /** Currently selected from date */
  dateFrom: string;
  /** Currently selected to date */
  dateTo: string;
  /** Callback to clear date range */
  onClearDates: () => void;
  /** Currently selected restrictions */
  restrictions: string[];
  /** Callback to clear a single restriction */
  onClearRestriction: (restriction: string) => void;
  /** Callback to clear all restrictions */
  onClearAllRestrictions: () => void;
  /** Callback to clear all filters at once */
  onClearAll: () => void;
}

/**
 * Display label for a restriction filter chip.
 */
const getRestrictionLabel = (restriction: string): string => {
  if (restriction === 'none') {
    return 'No restrictions';
  }
  return restriction;
};

/**
 * Get a consistent color class for a restriction type (dark mode).
 * Uses a hash-based approach to ensure every restriction gets a distinct, consistent color.
 */
const getRestrictionColor = (restriction: string): string => {
  // Special case for 'none'
  if (restriction === 'none') {
    return 'bg-gray-700/50 text-gray-300';
  }

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

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

/**
 * Removable chip component for an active filter (dark mode).
 */
const FilterChip: FC<FilterChipProps> = ({
  label,
  onRemove,
}) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-300">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Remove filter: ${label}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </span>
  );
};

interface RestrictionChipProps {
  restriction: string;
  onRemove: () => void;
}

/**
 * Removable chip component for a restriction filter with consistent color (dark mode).
 */
const RestrictionChip: FC<RestrictionChipProps> = ({
  restriction,
  onRemove,
}) => {
  const colorClass = getRestrictionColor(restriction);
  const label = getRestrictionLabel(restriction);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={`Remove filter: ${label}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </span>
  );
};

/**
 * Active filter chips with remove buttons (dark mode).
 *
 * Displays all currently active filters as removable chips.
 * Restriction chips use consistent hash-based colors matching ResultRow and RestrictionFilter.
 * Includes a "Clear all" button when multiple filters are active.
 * Renders nothing when no filters are active.
 */
export const ActiveFilters: FC<ActiveFiltersProps> = ({
  credit,
  onClearCredit,
  dateFrom,
  dateTo,
  onClearDates,
  restrictions,
  onClearRestriction,
  onClearAllRestrictions,
  onClearAll,
}) => {
  // Count active filters
  const hasCredit = !!credit;
  const hasDates = !!dateFrom || !!dateTo;
  const hasRestrictions = restrictions.length > 0;

  const activeFilterCount =
    (hasCredit ? 1 : 0) +
    (hasDates ? 1 : 0) +
    restrictions.length;

  // Don't render if no filters are active
  if (activeFilterCount === 0) {
    return null;
  }

  const showClearAll = activeFilterCount > 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-500">Active filters:</span>

      {hasCredit && (
        <FilterChip label={`Credit: ${credit}`} onRemove={onClearCredit} />
      )}

      {hasDates && (
        <FilterChip
          label={`Dates: ${dateFrom || '...'} - ${dateTo || '...'}`}
          onRemove={onClearDates}
        />
      )}

      {restrictions.map((restriction) => (
        <RestrictionChip
          key={restriction}
          restriction={restriction}
          onRemove={() => onClearRestriction(restriction)}
        />
      ))}

      {showClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

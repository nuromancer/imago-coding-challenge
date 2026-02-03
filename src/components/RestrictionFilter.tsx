'use client';

import type { FC } from 'react';

interface RestrictionFilterProps {
  /** List of available restriction options */
  options: string[];
  /** Currently selected restrictions */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
}

/**
 * Get display label for a restriction option.
 * Special handling: 'none' displays as "No restrictions"
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

/**
 * Checkbox group for filtering by restrictions (dark mode).
 *
 * Implements accessible checkbox group pattern with:
 * - Fieldset/legend for semantic grouping
 * - Individual labeled checkboxes with colored badges
 * - Multi-select with OR logic
 */
export const RestrictionFilter: FC<RestrictionFilterProps> = ({
  options,
  selected,
  onChange,
}) => {
  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, option]);
    } else {
      onChange(selected.filter((s) => s !== option));
    }
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-300">Restrictions</legend>
      <div
        role="group"
        aria-label="Restriction filters"
        className="mt-2 flex flex-wrap gap-x-3 gap-y-2"
      >
        {options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-opacity ${getRestrictionColor(option)} ${
              selected.includes(option) ? 'opacity-100 ring-2 ring-white/30' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) => handleChange(option, e.target.checked)}
              className="sr-only"
            />
            <span>{getRestrictionLabel(option)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

'use client';

import type { FC } from 'react';

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Placeholder text (default: "Search...") */
  placeholder?: string;
}

/**
 * Search input with clear button (dark mode).
 *
 * Full-width input with accessible labeling and a clear button that
 * appears when text is present.
 */
export const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  return (
    <div className="relative w-full">
      <label htmlFor="search-input" className="sr-only">
        Search media
      </label>
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 pr-10 text-base text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        aria-label="Search media"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

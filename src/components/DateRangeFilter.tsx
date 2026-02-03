'use client';

import type { FC } from 'react';
import { useState } from 'react';

interface DateRangeFilterProps {
  /** Current from date (ISO format) */
  dateFrom: string;
  /** Current to date (ISO format) */
  dateTo: string;
  /** Minimum allowed date (ISO format) */
  minDate: string;
  /** Maximum allowed date (ISO format) */
  maxDate: string;
  /** Callback when dates change */
  onChange: (from: string, to: string) => void;
}

/**
 * Date range filter with from/to date pickers (dark mode).
 *
 * Uses native HTML5 date inputs which handle locale display automatically.
 * Validates that from date cannot be after to date using input constraints.
 */
export const DateRangeFilter: FC<DateRangeFilterProps> = ({
  dateFrom,
  dateTo,
  minDate,
  maxDate,
  onChange,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleFromChange = (value: string) => {
    // Validate: from cannot be after to
    if (dateTo && value > dateTo) {
      setError('Start date cannot be after end date');
      return;
    }
    setError(null);
    onChange(value, dateTo);
  };

  const handleToChange = (value: string) => {
    // Validate: to cannot be before from
    if (dateFrom && value < dateFrom) {
      setError('End date cannot be before start date');
      return;
    }
    setError(null);
    onChange(dateFrom, value);
  };

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-300">Date Range</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          min={minDate}
          max={dateTo || maxDate}
          onChange={(e) => handleFromChange(e.target.value)}
          aria-label="From date"
          className="rounded border border-gray-600 bg-gray-700 px-2 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-gray-500">-</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom || minDate}
          max={maxDate}
          onChange={(e) => handleToChange(e.target.value)}
          aria-label="To date"
          className="rounded border border-gray-600 bg-gray-700 px-2 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {error && (
        <span className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

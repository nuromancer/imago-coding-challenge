'use client';

import type { FC } from 'react';
import { DateRangeFilter } from './DateRangeFilter';
import { CreditFilter } from './CreditFilter';
import { RestrictionFilter } from './RestrictionFilter';

interface FilterBarProps {
  /** Filter options from API */
  options: {
    credits: string[];
    restrictions: string[];
    dateRange: {
      min: string;
      max: string;
    };
  };
  /** Current filter values */
  credit: string;
  dateFrom: string;
  dateTo: string;
  restrictions: string[];
  /** Change handlers */
  onCreditChange: (credit: string) => void;
  onDateChange: (from: string, to: string) => void;
  onRestrictionsChange: (restrictions: string[]) => void;
}

/**
 * Container component for all filter controls.
 *
 * Renders filter inputs in a horizontal layout:
 * - Credit autocomplete (photographer)
 * - Date range picker
 * - Restriction checkboxes
 */
export const FilterBar: FC<FilterBarProps> = ({
  options,
  credit,
  dateFrom,
  dateTo,
  restrictions,
  onCreditChange,
  onDateChange,
  onRestrictionsChange,
}) => {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="flex flex-wrap items-end gap-6">
        {/* Photographer filter first */}
        <div className="min-w-[200px]">
          <CreditFilter
            options={options.credits}
            value={credit}
            onChange={onCreditChange}
          />
        </div>

        {/* Date range second */}
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          minDate={options.dateRange.min}
          maxDate={options.dateRange.max}
          onChange={onDateChange}
        />

        <RestrictionFilter
          options={options.restrictions}
          selected={restrictions}
          onChange={onRestrictionsChange}
        />
      </div>
    </div>
  );
};

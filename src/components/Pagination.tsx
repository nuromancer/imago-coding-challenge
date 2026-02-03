'use client';

import type { FC } from 'react';

interface PaginationProps {
  /** Current page number (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page size */
  pageSize: number;
  /** Total number of results */
  total: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
}

/**
 * Generate page numbers with ellipsis for large page counts.
 * Always shows first and last page with 2 pages around current.
 */
const getPageNumbers = (page: number, totalPages: number): (number | 'ellipsis')[] => {
  const pages: (number | 'ellipsis')[] = [];
  const showPages = 5;

  if (totalPages <= showPages + 2) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    // Add ellipsis before range if needed
    if (start > 2) {
      pages.push('ellipsis');
    }

    // Add pages around current
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis after range if needed
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
};

const PAGE_SIZES = [10, 20, 50, 100] as const;

/**
 * Pagination controls with page numbers and size selector (dark mode).
 *
 * Features:
 * - Shows page numbers with ellipsis for large page counts
 * - Prev/Next buttons disabled at boundaries
 * - Page size dropdown (10, 20, 50, 100)
 * - Accessible with proper ARIA attributes
 */
export const Pagination: FC<PaginationProps> = ({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-700 pt-4"
    >
      {/* Results info */}
      <span className="text-sm text-gray-400">
        {total.toLocaleString()} results - Page {page} of {totalPages}
      </span>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-800"
        >
          Prev
        </button>

        {/* Page number buttons */}
        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 py-1.5 text-sm text-gray-500"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={`min-w-[2.5rem] rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
                p === page
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-800"
        >
          Next
        </button>
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="page-size" className="text-sm text-gray-400">
          Per page:
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Results per page"
          className="rounded border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
};

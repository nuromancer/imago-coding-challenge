'use client';

import type { FC } from 'react';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useSearch';
import { SearchInput } from '@/components/SearchInput';
import { ResultsList } from '@/components/ResultsList';
import { FilterBar } from '@/components/FilterBar';
import { SortControl } from '@/components/SortControl';
import { ActiveFilters } from '@/components/ActiveFilters';
import { SkeletonRows } from '@/components/SkeletonRows';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Pagination } from '@/components/Pagination';
import type { FiltersResponse } from '@/lib/api/types';

// Configure nuqs to use push instead of replace for browser history
const queryOptions = { history: 'push' as const };

/**
 * Search page content with debounced search, filters, and URL state.
 *
 * Uses nuqs for URL state persistence so searches are shareable.
 * Debounces search input by 400ms to prevent excessive API calls.
 */
const SearchPageContent: FC = () => {
  // URL state for query and pagination - with push history for back/forward
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault('').withOptions(queryOptions));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions(queryOptions));
  const [pageSize, setPageSize] = useQueryState('pageSize', parseAsInteger.withDefault(20).withOptions(queryOptions));

  // URL state for filters - with push history for back/forward
  const [credit, setCredit] = useQueryState('credit', parseAsString.withDefault('').withOptions(queryOptions));
  const [dateFrom, setDateFrom] = useQueryState('dateFrom', parseAsString.withDefault('').withOptions(queryOptions));
  const [dateTo, setDateTo] = useQueryState('dateTo', parseAsString.withDefault('').withOptions(queryOptions));
  const [restrictionsStr, setRestrictionsStr] = useQueryState('restrictions', parseAsString.withDefault('').withOptions(queryOptions));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('').withOptions(queryOptions));

  // Parse restrictions string to array
  const restrictions = restrictionsStr ? restrictionsStr.split(',').filter(Boolean) : [];

  // Cast sort to typed value
  const sortValue = (sort === 'asc' || sort === 'desc') ? sort : null;

  // Debounce the query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 400);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FiltersResponse | null>(null);
  const filtersFetched = useRef(false);

  // Fetch filter options once on mount
  useEffect(() => {
    if (filtersFetched.current) return;
    filtersFetched.current = true;

    fetch('/api/filters')
      .then((res) => res.json())
      .then((data: FiltersResponse) => setFilterOptions(data))
      .catch((err) => console.error('Failed to fetch filters:', err));
  }, []);

  // Build URLSearchParams from state
  const searchParams = new URLSearchParams();
  if (debouncedQuery) {
    searchParams.set('q', debouncedQuery);
  }
  searchParams.set('page', String(page));
  searchParams.set('pageSize', String(pageSize));
  if (credit) {
    searchParams.set('credit', credit);
  }
  if (dateFrom) {
    searchParams.set('dateFrom', dateFrom);
  }
  if (dateTo) {
    searchParams.set('dateTo', dateTo);
  }
  if (restrictions.length > 0) {
    // API expects multiple restriction params
    restrictions.forEach((r) => searchParams.append('restriction', r));
  }
  if (sortValue) {
    searchParams.set('sort', sortValue);
  }

  // Fetch search results
  const { data, isLoading, error, refetch } = useSearch(searchParams);

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({ debouncedQuery, credit, dateFrom, dateTo, restrictionsStr, sort, pageSize });

  // Reset page to 1 when query, filters, or pageSize change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.debouncedQuery !== debouncedQuery ||
      prev.credit !== credit ||
      prev.dateFrom !== dateFrom ||
      prev.dateTo !== dateTo ||
      prev.restrictionsStr !== restrictionsStr ||
      prev.sort !== sort ||
      prev.pageSize !== pageSize;

    if (filtersChanged && page !== 1) {
      setPage(1);
    }

    prevFiltersRef.current = { debouncedQuery, credit, dateFrom, dateTo, restrictionsStr, sort, pageSize };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, credit, dateFrom, dateTo, restrictionsStr, sort, pageSize]);

  // Handler functions for filters
  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from || null);
    setDateTo(to || null);
  };

  const handleRestrictionsChange = (newRestrictions: string[]) => {
    setRestrictionsStr(newRestrictions.length > 0 ? newRestrictions.join(',') : null);
  };

  const handleSortChange = (newSort: 'asc' | 'desc' | null) => {
    setSort(newSort || null);
  };

  // Clear functions for active filters
  const handleClearCredit = () => setCredit(null);
  const handleClearDates = () => {
    setDateFrom(null);
    setDateTo(null);
  };
  const handleClearRestriction = (restriction: string) => {
    const newRestrictions = restrictions.filter((r) => r !== restriction);
    setRestrictionsStr(newRestrictions.length > 0 ? newRestrictions.join(',') : null);
  };
  const handleClearAllRestrictions = () => setRestrictionsStr(null);
  const handleClearAll = () => {
    setCredit(null);
    setDateFrom(null);
    setDateTo(null);
    setRestrictionsStr(null);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    // Page reset happens automatically via the effect when pageSize changes
    setPageSize(newSize);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">
            IMAGO Media Search
          </h1>
          <p className="mt-2 text-gray-400">
            Search the IMAGO media archive
          </p>
        </header>

        {/* Search input */}
        <div className="mb-6">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search media..."
          />
        </div>

        {/* Filter bar */}
        {filterOptions && (
          <div className="mb-4">
            <FilterBar
              options={filterOptions}
              credit={credit}
              dateFrom={dateFrom}
              dateTo={dateTo}
              restrictions={restrictions}
              onCreditChange={(val) => setCredit(val || null)}
              onDateChange={handleDateChange}
              onRestrictionsChange={handleRestrictionsChange}
            />
          </div>
        )}

        {/* Sort control and active filters row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <ActiveFilters
            credit={credit}
            onClearCredit={handleClearCredit}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onClearDates={handleClearDates}
            restrictions={restrictions}
            onClearRestriction={handleClearRestriction}
            onClearAllRestrictions={handleClearAllRestrictions}
            onClearAll={handleClearAll}
          />
          <SortControl sort={sortValue} onChange={handleSortChange} />
        </div>

        {/* Results section */}
        <main className="min-h-[400px]">
          {/* Loading state */}
          {isLoading && <SkeletonRows count={5} />}

          {/* Error state */}
          {!isLoading && error && (
            <ErrorState error={error} onRetry={refetch} />
          )}

          {/* Empty state */}
          {!isLoading && !error && data && data.items.length === 0 && (
            <EmptyState query={debouncedQuery || undefined} />
          )}

          {/* Results */}
          {!isLoading && !error && data && data.items.length > 0 && (
            <>
              <ResultsList
                items={data.items}
                total={data.total}
                query={debouncedQuery || undefined}
              />

              {/* Pagination - only show when more than 1 page */}
              {data.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    pageSize={pageSize}
                    total={data.total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Main search page wrapped in Suspense for SSR compatibility.
 *
 * Suspense boundary is required because nuqs uses useSearchParams internally.
 */
const SearchPage: FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-100">
                IMAGO Media Search
              </h1>
              <p className="mt-2 text-gray-400">
                Search the IMAGO media archive
              </p>
            </header>
            <div className="min-h-[400px]">
              <SkeletonRows count={5} />
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;

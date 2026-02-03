'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SearchResponse } from '@/lib/api/types';

interface UseSearchResult {
  /** Search response data, null before first successful fetch */
  data: SearchResponse | null;
  /** True while fetch is in progress */
  isLoading: boolean;
  /** Error if fetch failed, null otherwise */
  error: Error | null;
  /** Manually trigger a refetch with current params */
  refetch: () => void;
}

/**
 * Hook to fetch search results from the API.
 *
 * Automatically cancels in-flight requests when params change.
 * Uses AbortController for cleanup on unmount.
 *
 * @param params - URLSearchParams to send to /api/search
 * @returns Search state with data, loading, error, and refetch function
 *
 * @example
 * const params = new URLSearchParams({ q: 'berlin' });
 * const { data, isLoading, error, refetch } = useSearch(params);
 */
export const useSearch = (params: URLSearchParams): UseSearchResult => {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const paramsString = params.toString();

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?${paramsString}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }

        const result: SearchResponse = await response.json();
        setData(result);
      } catch (err) {
        // Don't set error for aborted requests (expected during cleanup)
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        // Only update loading state if not aborted
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [paramsString, fetchTrigger]);

  return { data, isLoading, error, refetch };
};

'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value by delaying updates until after the specified delay.
 *
 * Useful for search inputs to prevent excessive API calls while typing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating the debounced value
 * @returns The debounced value
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 400);
 * // debouncedQuery updates 400ms after the last query change
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

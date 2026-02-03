'use client';

import type { FC } from 'react';

interface ErrorStateProps {
  /** Error object or message string */
  error: Error | string;
  /** Callback to retry the failed operation */
  onRetry: () => void;
}

/**
 * Displayed when an API request fails (dark mode).
 *
 * Shows the error message with a retry button.
 * Uses role="alert" for accessibility.
 */
export const ErrorState: FC<ErrorStateProps> = ({ error, onRetry }) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="py-12 text-center">
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Error message */}
      <div role="alert" className="mb-4">
        <h3 className="mb-2 text-lg font-medium text-gray-200">
          Something went wrong
        </h3>
        <p className="text-sm text-red-400">
          {errorMessage || 'An unexpected error occurred'}
        </p>
      </div>

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Retry
      </button>
    </div>
  );
};

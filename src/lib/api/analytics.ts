/**
 * Analytics module for tracking search queries.
 *
 * Provides in-memory storage for query logs and aggregated statistics.
 * Uses module-scope singleton to persist data across serverless invocations.
 */

/**
 * Individual query log entry.
 */
export interface QueryLog {
  query: string;
  resultCount: number;
  responseTimeMs: number;
  timestamp: number;
}

/**
 * Aggregated analytics summary.
 */
export interface AnalyticsSummary {
  totalSearches: number;
  avgResultsPerQuery: number;
  avgResponseTimeMs: number;
  topSearchTerms: Array<{ term: string; count: number }>;
}

/**
 * Maximum number of query logs to store.
 * Cap to prevent unbounded memory growth.
 */
const MAX_LOGS = 10000;

/**
 * Module-scope singleton array for query logs.
 * Persists across warm serverless invocations.
 */
const queryLogs: QueryLog[] = [];

/**
 * Log a search query.
 *
 * @param entry - Query log entry to record
 */
export const logQuery = (entry: QueryLog): void => {
  queryLogs.push(entry);

  // Cap array size to prevent memory growth
  if (queryLogs.length > MAX_LOGS) {
    queryLogs.shift();
  }
};

/**
 * Get aggregated analytics summary.
 *
 * @returns Summary statistics for all logged queries
 */
export const getAnalytics = (): AnalyticsSummary => {
  // Return zeros if no logs
  if (queryLogs.length === 0) {
    return {
      totalSearches: 0,
      avgResultsPerQuery: 0,
      avgResponseTimeMs: 0,
      topSearchTerms: [],
    };
  }

  const totalSearches = queryLogs.length;

  // Calculate average results per query
  const totalResults = queryLogs.reduce((sum, log) => sum + log.resultCount, 0);
  const avgResultsPerQuery = Math.round(totalResults / totalSearches);

  // Calculate average response time
  const totalResponseTime = queryLogs.reduce(
    (sum, log) => sum + log.responseTimeMs,
    0
  );
  const avgResponseTimeMs = Math.round(totalResponseTime / totalSearches);

  // Build term frequency map
  const termCounts = new Map<string, number>();
  for (const log of queryLogs) {
    // Split query by whitespace and normalize
    const terms = log.query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    for (const term of terms) {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    }
  }

  // Sort by count descending, take top 10
  const topSearchTerms = Array.from(termCounts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalSearches,
    avgResultsPerQuery,
    avgResponseTimeMs,
    topSearchTerms,
  };
};

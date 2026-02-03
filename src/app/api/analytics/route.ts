/**
 * Analytics API endpoint.
 *
 * GET /api/analytics - Returns aggregated search analytics.
 *
 * Response: AnalyticsSummary with search statistics
 */

import { getAnalytics } from '@/lib/api/analytics';

export const GET = async () => {
  const stats = getAnalytics();
  return Response.json(stats);
};

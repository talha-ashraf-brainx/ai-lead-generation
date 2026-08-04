import type { AnalyticsOverview, AnalyticsSeries, AnalyticsSeriesPoint } from "../types/analytics.js";

const BUCKET_COUNT = 14;
const MIN_BUCKET_SPAN_MS = 86_400_000;

export interface RateCounts {
  total: number;
  opened: number;
  replied: number;
  converted: number;
}

export function computeRates({ total, opened, replied, converted }: RateCounts): AnalyticsOverview {
  if (total === 0) return { total: 0, openRate: 0, replyRate: 0, conversionRate: 0 };

  return {
    total,
    openRate: Math.round((opened / total) * 100),
    replyRate: Math.round((replied / total) * 100),
    conversionRate: Math.round((converted / total) * 100),
  };
}

export interface SeriesEventDates {
  opened: Date[];
  replied: Date[];
  converted: Date[];
}

// Mirrors the frontend mock's bucketing (frontend/src/lib/mock/analytics.ts) so the
// two agree once the frontend swaps over to this endpoint.
export function bucketSeries({ opened, replied, converted }: SeriesEventDates): AnalyticsSeries {
  const allTimestamps = [...opened, ...replied, ...converted].map((date) => date.getTime());
  if (allTimestamps.length === 0) return { opened: [], replied: [], converted: [] };

  const min = Math.min(...allTimestamps);
  const max = Math.max(...allTimestamps);
  const bucketSize = Math.max(max - min, MIN_BUCKET_SPAN_MS) / BUCKET_COUNT;

  function bucket(dates: Date[]): AnalyticsSeriesPoint[] {
    const counts = Array.from({ length: BUCKET_COUNT }, () => 0);
    dates.forEach((date) => {
      const index = Math.min(BUCKET_COUNT - 1, Math.floor((date.getTime() - min) / bucketSize));
      counts[index]++;
    });
    return counts.map((value, index) => ({ date: new Date(min + index * bucketSize).toISOString(), value }));
  }

  return { opened: bucket(opened), replied: bucket(replied), converted: bucket(converted) };
}

import { describe, expect, it } from "vitest";
import { bucketSeries, computeRates } from "./analyticsMath.js";

describe("computeRates", () => {
  it("returns all zeros when there are no leads", () => {
    expect(computeRates({ total: 0, opened: 0, replied: 0, converted: 0 })).toEqual({
      total: 0,
      openRate: 0,
      replyRate: 0,
      conversionRate: 0,
    });
  });

  it("computes rounded percentages", () => {
    expect(computeRates({ total: 3, opened: 2, replied: 1, converted: 1 })).toEqual({
      total: 3,
      openRate: 67,
      replyRate: 33,
      conversionRate: 33,
    });
  });

  it("handles a full-conversion set", () => {
    expect(computeRates({ total: 4, opened: 4, replied: 4, converted: 4 })).toEqual({
      total: 4,
      openRate: 100,
      replyRate: 100,
      conversionRate: 100,
    });
  });
});

describe("bucketSeries", () => {
  it("returns empty series when there are no events", () => {
    expect(bucketSeries({ opened: [], replied: [], converted: [] })).toEqual({
      opened: [],
      replied: [],
      converted: [],
    });
  });

  it("buckets events into 14 points covering the full span", () => {
    const day1 = new Date("2026-01-01T00:00:00.000Z");
    const day2 = new Date("2026-01-02T00:00:00.000Z");
    const day3 = new Date("2026-01-03T00:00:00.000Z");

    const series = bucketSeries({ opened: [day1, day1, day3], replied: [day2], converted: [] });

    expect(series.opened).toHaveLength(14);
    expect(series.replied).toHaveLength(14);
    expect(series.converted).toHaveLength(14);
    expect(series.opened.reduce((sum, point) => sum + point.value, 0)).toBe(3);
    expect(series.replied.reduce((sum, point) => sum + point.value, 0)).toBe(1);
    expect(series.opened[0].value).toBe(2);
    expect(series.opened[13].value).toBe(1);
  });

  it("gives a single event its own last bucket without dividing by zero", () => {
    const onlyEvent = new Date("2026-01-01T00:00:00.000Z");
    const series = bucketSeries({ opened: [onlyEvent], replied: [], converted: [] });

    expect(series.opened.reduce((sum, point) => sum + point.value, 0)).toBe(1);
  });
});

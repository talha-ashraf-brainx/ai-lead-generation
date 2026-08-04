export interface AnalyticsOverview {
  total: number;
  openRate: number;
  replyRate: number;
  conversionRate: number;
}

export interface AnalyticsSeriesPoint {
  date: string;
  value: number;
}

export interface AnalyticsSeries {
  opened: AnalyticsSeriesPoint[];
  replied: AnalyticsSeriesPoint[];
  converted: AnalyticsSeriesPoint[];
}

export interface CampaignBreakdownRow extends AnalyticsOverview {
  campaignId: string;
  campaignName: string;
}

export interface AnalyticsDateRange {
  dateFrom?: string;
  dateTo?: string;
}

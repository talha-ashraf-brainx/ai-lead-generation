import type { SelectQueryBuilder } from "typeorm";
import { Campaign } from "../entities/Campaign.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { bucketSeries, computeRates } from "../lib/analyticsMath.js";
import type { AnalyticsDateRange, AnalyticsOverview, AnalyticsSeries, CampaignBreakdownRow } from "../types/analytics.js";

const OPENED_OR_LATER = "'opened','replied','converted'";
const REPLIED_OR_LATER = "'replied','converted'";

function leads() {
  return AppDataSource.getRepository(Lead);
}

function campaigns() {
  return AppDataSource.getRepository(Campaign);
}

function applyDateRange(qb: SelectQueryBuilder<Lead>, range: AnalyticsDateRange): void {
  if (range.dateFrom) qb.andWhere("lead.createdAt >= :dateFrom", { dateFrom: range.dateFrom });
  if (range.dateTo) qb.andWhere("lead.createdAt <= :dateTo", { dateTo: range.dateTo });
}

interface RateRow {
  total: string;
  opened: string;
  replied: string;
  converted: string;
}

function rateSelect(qb: SelectQueryBuilder<Lead>) {
  return qb
    .select("COUNT(*)", "total")
    .addSelect(`COUNT(*) FILTER (WHERE lead.status IN (${OPENED_OR_LATER}))`, "opened")
    .addSelect(`COUNT(*) FILTER (WHERE lead.status IN (${REPLIED_OR_LATER}))`, "replied")
    .addSelect(`COUNT(*) FILTER (WHERE lead.status = 'converted')`, "converted");
}

export async function getAnalyticsOverview(range: AnalyticsDateRange): Promise<AnalyticsOverview> {
  const qb = leads().createQueryBuilder("lead");
  applyDateRange(qb, range);
  const row = (await rateSelect(qb).getRawOne<RateRow>())!;

  return computeRates({
    total: Number(row.total),
    opened: Number(row.opened),
    replied: Number(row.replied),
    converted: Number(row.converted),
  });
}

export async function getAnalyticsSeries(range: AnalyticsDateRange): Promise<AnalyticsSeries> {
  const qb = leads().createQueryBuilder("lead");
  applyDateRange(qb, range);
  const rows = await qb.getMany();

  return bucketSeries({
    opened: rows.filter((lead) => lead.openedAt).map((lead) => lead.openedAt as Date),
    replied: rows.filter((lead) => lead.repliedAt).map((lead) => lead.repliedAt as Date),
    converted: rows.filter((lead) => lead.convertedAt).map((lead) => lead.convertedAt as Date),
  });
}

export async function getCampaignBreakdown(range: AnalyticsDateRange): Promise<CampaignBreakdownRow[]> {
  const allCampaigns = await campaigns().find({ order: { createdAt: "DESC" } });

  const qb = leads().createQueryBuilder("lead").where("lead.campaignId IS NOT NULL").groupBy("lead.campaignId");
  applyDateRange(qb, range);
  rateSelect(qb).addSelect("lead.campaignId", "campaignId");
  const rows = await qb.getRawMany<RateRow & { campaignId: string }>();
  const byCampaignId = new Map(rows.map((row) => [row.campaignId, row]));

  return allCampaigns.map((campaign) => {
    const row = byCampaignId.get(campaign.id);
    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      ...computeRates({
        total: row ? Number(row.total) : 0,
        opened: row ? Number(row.opened) : 0,
        replied: row ? Number(row.replied) : 0,
        converted: row ? Number(row.converted) : 0,
      }),
    };
  });
}

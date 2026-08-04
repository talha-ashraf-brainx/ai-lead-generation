import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CAMPAIGN_SCHEDULES, CAMPAIGN_STATUSES, type CampaignSchedule, type CampaignStatus } from "../types/campaign.js";

@Entity({ name: "campaigns" })
export class Campaign {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "enum", enum: CAMPAIGN_STATUSES, default: "draft" })
  status!: CampaignStatus;

  @Column({ type: "enum", enum: CAMPAIGN_SCHEDULES, default: "immediate" })
  schedule!: CampaignSchedule;

  @Column({ type: "timestamptz", nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: "boolean", default: true })
  followUpDay3Enabled!: boolean;

  @Column({ type: "varchar" })
  followUpDay3Subject!: string;

  @Column({ type: "text" })
  followUpDay3Body!: string;

  @Column({ type: "boolean", default: true })
  followUpDay7Enabled!: boolean;

  @Column({ type: "varchar" })
  followUpDay7Subject!: string;

  @Column({ type: "text" })
  followUpDay7Body!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  sentAt!: Date | null;
}

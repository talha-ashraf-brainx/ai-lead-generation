import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SEND_STAGES, SEND_STATUSES, type SendStage, type SendStatus } from "../types/campaign.js";

// One row per lead per sequence stage (initial/day3/day7). day3/day7 rows are created
// lazily by the worker once the preceding stage sends — not upfront at campaign creation —
// so "conditional on no reply" can be checked against the lead's status at fire time.
@Entity({ name: "campaign_sends" })
export class CampaignSend {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  campaignId!: string;

  @Column({ type: "uuid" })
  leadId!: string;

  @Column({ type: "enum", enum: SEND_STAGES })
  stage!: SendStage;

  @Column({ type: "enum", enum: SEND_STATUSES, default: "queued" })
  status!: SendStatus;

  @Column({ type: "varchar" })
  subject!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "varchar", nullable: true })
  resendMessageId!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  sentAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  openedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  clickedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  bouncedAt!: Date | null;

  @Column({ type: "varchar", nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

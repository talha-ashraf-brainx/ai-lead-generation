import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ENRICHMENT_STATUSES, LEAD_SOURCES, LEAD_STATUSES, type EnrichmentStatus, type LeadSource, type LeadStatus } from "../types/lead.js";

@Entity({ name: "leads" })
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  company!: string;

  @Column({ type: "varchar" })
  contactName!: string;

  @Column({ type: "varchar", nullable: true })
  email!: string | null;

  @Column({ type: "varchar", default: "" })
  website!: string;

  @Column({ type: "varchar" })
  industry!: string;

  @Column({ type: "enum", enum: LEAD_STATUSES, default: "new" })
  status!: LeadStatus;

  // Set once, the first time the lead reaches that status — feeds the Analytics
  // module's trend series (Phase 8). Null if the lead hasn't reached that stage.
  @Column({ type: "timestamptz", nullable: true })
  openedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  repliedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  convertedAt!: Date | null;

  @Column({ type: "enum", enum: ENRICHMENT_STATUSES, default: "pending" })
  enrichment!: EnrichmentStatus;

  @Column({ type: "int", default: 0 })
  enrichmentAttempts!: number;

  @Column({ type: "varchar", nullable: true })
  enrichmentError!: string | null;

  // No DB-level FK yet — the Campaign table doesn't exist until Phase 5/6, which will
  // add the formal constraint. campaignName is denormalized to match the frontend's
  // Lead contract (avoids a join before Campaign exists).
  @Column({ type: "uuid", nullable: true })
  campaignId!: string | null;

  @Column({ type: "varchar", nullable: true })
  campaignName!: string | null;

  @Column({ type: "varchar", nullable: true })
  painPoint!: string | null;

  @Column({ type: "enum", enum: LEAD_SOURCES })
  source!: LeadSource;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

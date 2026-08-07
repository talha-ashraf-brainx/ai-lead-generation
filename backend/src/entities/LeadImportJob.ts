import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IMPORT_JOB_STATUSES, type ImportJobStatus } from "../types/lead.js";

// Tracks a keyword/location lead-search run so the client can poll progress
// instead of blocking (FR-LEAD-IN-5). CSV import is synchronous and doesn't need this.
@Entity({ name: "lead_import_jobs" })
export class LeadImportJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar" })
  niche!: string;

  @Column({ type: "varchar" })
  location!: string;

  @Column({ type: "enum", enum: IMPORT_JOB_STATUSES, default: "processing" })
  status!: ImportJobStatus;

  @Column({ type: "int", default: 0 })
  importedCount!: number;

  @Column({ type: "int", default: 0 })
  duplicateCount!: number;

  @Column({ type: "int", default: 0 })
  errorCount!: number;

  @Column({ type: "varchar", nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  completedAt!: Date | null;
}

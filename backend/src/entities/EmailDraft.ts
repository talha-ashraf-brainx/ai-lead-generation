import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EMAIL_DRAFT_STATUSES, type EmailDraftStatus, type PersonalizationVariable } from "../types/email.js";

@Entity({ name: "email_drafts" })
export class EmailDraft {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "uuid", unique: true })
  leadId!: string;

  @Column({ type: "varchar" })
  subject!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "enum", enum: EMAIL_DRAFT_STATUSES, default: "draft" })
  status!: EmailDraftStatus;

  @Column({ type: "jsonb", default: () => "'[]'" })
  personalization!: PersonalizationVariable[];

  @CreateDateColumn({ type: "timestamptz" })
  generatedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  editedAt!: Date | null;
}

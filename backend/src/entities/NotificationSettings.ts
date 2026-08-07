import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Exactly one row per user, created lazily with defaults on first read
// (see notificationService.getOrCreateSettings).
@Entity({ name: "notification_settings" })
export class NotificationSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  userId!: string;

  @Column({ type: "boolean", default: false })
  slackEnabled!: boolean;

  @Column({ type: "varchar", nullable: true })
  slackWebhookUrl!: string | null;

  @Column({ type: "boolean", default: true })
  emailAlertsEnabled!: boolean;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}

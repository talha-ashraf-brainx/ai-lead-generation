import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { NOTIFICATION_KINDS, type NotificationKind } from "../types/notification.js";

// Named AppNotification (matching the frontend type) rather than Notification to
// avoid any ambiguity with the DOM Notification API.
@Entity({ name: "notifications" })
export class AppNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "enum", enum: NOTIFICATION_KINDS })
  kind!: NotificationKind;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  detail!: string;

  // Nullable + no cascade: a notification is a historical record that should outlive
  // the lead/campaign it references if either is later deleted.
  @Column({ type: "uuid", nullable: true })
  leadId!: string | null;

  @Column({ type: "uuid", nullable: true })
  campaignId!: string | null;

  @Column({ type: "boolean", default: false })
  read!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Exactly one row per user, same auto-create-on-first-read pattern as
// NotificationSettings. smtpPassword is stored encrypted (lib/encryption.ts) but,
// unlike API keys, is decrypted back on read — the frontend form is round-trippable,
// not write-only.
@Entity({ name: "sender_identity" })
export class SenderIdentitySettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  userId!: string;

  @Column({ type: "varchar", default: "Emberline Outreach" })
  fromName!: string;

  @Column({ type: "varchar", default: "outreach@emberline.io" })
  fromEmail!: string;

  @Column({ type: "boolean", default: false })
  smtpFallbackEnabled!: boolean;

  @Column({ type: "varchar", default: "" })
  smtpHost!: string;

  @Column({ type: "varchar", default: "" })
  smtpPort!: string;

  @Column({ type: "varchar", default: "" })
  smtpUsername!: string;

  @Column({ type: "text" })
  smtpPasswordEncrypted!: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}

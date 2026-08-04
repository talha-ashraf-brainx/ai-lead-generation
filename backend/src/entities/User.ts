import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Single account-owner user (per SRS: no self-serve signup, one authenticated user per instance).
@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar" })
  passwordHash!: string;

  @Column({ type: "varchar", nullable: true })
  name!: string | null;

  // Password reset flow — token is stored as a SHA-256 hash, never in plaintext.
  @Column({ type: "varchar", nullable: true })
  resetTokenHash!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  resetTokenExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

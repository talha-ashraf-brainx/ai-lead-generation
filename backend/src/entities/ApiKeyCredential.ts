import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { API_KEY_PROVIDERS, type ApiKeyProvider } from "../types/settings.js";

// One row per provider, created on first save (see settingsService.saveApiKey).
// `encryptedValue` holds the reversibly-encrypted raw key (lib/encryption.ts);
// `maskedValue` is derived once at write time so a read never needs to decrypt.
@Entity({ name: "api_key_credentials" })
export class ApiKeyCredential {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: API_KEY_PROVIDERS, unique: true })
  provider!: ApiKeyProvider;

  @Column({ type: "text" })
  encryptedValue!: string;

  @Column({ type: "varchar" })
  maskedValue!: string;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}

import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./encryption.js";

describe("encryptSecret/decryptSecret", () => {
  it("round-trips a plaintext value", () => {
    const ciphertext = encryptSecret("sk-live-abc123");
    expect(decryptSecret(ciphertext)).toBe("sk-live-abc123");
  });

  it("round-trips an empty string", () => {
    const ciphertext = encryptSecret("");
    expect(decryptSecret(ciphertext)).toBe("");
  });

  it("produces different ciphertext for the same plaintext each time", () => {
    const first = encryptSecret("same-value");
    const second = encryptSecret("same-value");
    expect(first).not.toBe(second);
  });

  it("does not leak the plaintext in the ciphertext", () => {
    const ciphertext = encryptSecret("super-secret-key");
    expect(ciphertext).not.toContain("super-secret-key");
  });
});

describe("maskSecret", () => {
  it("keeps only the last 4 characters visible", () => {
    expect(maskSecret("sk-live-abc123")).toBe("••••••••c123");
  });
});

import { User } from "../entities/User.js";
import { AppDataSource } from "../lib/dataSource.js";
import { env } from "../lib/env.js";
import { comparePassword, generateResetToken, hashPassword, hashResetToken } from "../lib/hash.js";
import { signAuthToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../middleware/errorHandler.js";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

function users() {
  return AppDataSource.getRepository(User);
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

export async function login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
  const user = await users().findOne({ where: { email: email.toLowerCase() } });

  // Same generic error whether the email is unknown or the password is wrong (FR-AUTH-3).
  const invalidCredentials = () => new ApiError(401, "Invalid email or password");
  if (!user) throw invalidCredentials();

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials();

  const token = signAuthToken({ sub: user.id, email: user.email });
  return { token, user: toPublicUser(user) };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await users().findOne({ where: { id } });
  if (!user) throw new ApiError(401, "Invalid or expired session");
  return toPublicUser(user);
}

export async function requestPasswordReset(email: string): Promise<{ devToken?: string }> {
  const user = await users().findOne({ where: { email: email.toLowerCase() } });

  // Always respond as if the request succeeded — don't reveal whether the email exists.
  if (!user) return {};

  const { token, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000);

  user.resetTokenHash = tokenHash;
  user.resetTokenExpiresAt = expiresAt;
  await users().save(user);

  // Real delivery is wired up in the Notifications module (Phase 7). Until then, surface the
  // token through server logs (and the API response in debug mode) so the flow is testable.
  logger.info(`Password reset requested for ${user.email}`, { resetToken: token });
  return env.debug ? { devToken: token } : {};
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashResetToken(token);
  const user = await users().findOne({ where: { resetTokenHash: tokenHash } });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  await users().save(user);
}

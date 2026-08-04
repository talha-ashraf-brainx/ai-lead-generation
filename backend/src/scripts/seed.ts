import bcrypt from "bcryptjs";
import { User } from "../entities/User.js";
import { AppDataSource } from "../lib/dataSource.js";
import { env } from "../lib/env.js";

async function main() {
  await AppDataSource.initialize();
  const users = AppDataSource.getRepository(User);

  const email = env.accountOwnerEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(env.accountOwnerPassword, 12);

  const existing = await users.findOne({ where: { email } });
  if (existing) {
    console.log(`Account owner already exists: ${existing.email} (id: ${existing.id})`);
  } else {
    const user = await users.save(users.create({ email, passwordHash, name: env.accountOwnerName }));
    console.log(`Account owner created: ${user.email} (id: ${user.id})`);
  }

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});

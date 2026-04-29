/**
 * Promote a user to ADMIN role.
 *
 *   npx tsx scripts/promote-admin.ts <email>
 *
 * Run with --demote to remove the role:
 *
 *   npx tsx scripts/promote-admin.ts <email> --demote
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const localPath = resolve(process.cwd(), ".env.local");
if (existsSync(localPath)) loadEnv({ path: localPath, override: true });

import { db } from "../src/lib/db";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const demote = process.argv.includes("--demote");
  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email> [--demote]");
    process.exit(1);
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✖ No user with email ${email}`);
    process.exit(1);
  }
  const newRole = demote ? "USER" : "ADMIN";
  await db.user.update({ where: { id: user.id }, data: { role: newRole } });
  console.log(`✓ ${email} → ${newRole}`);
}

main()
  .catch((err) => {
    console.error("\n✖ Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

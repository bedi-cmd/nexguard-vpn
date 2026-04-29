/**
 * Smoke test for the auth system.
 *
 * Exercises the building blocks (Prisma + bcrypt + verification token) end-to-end
 * against the real database. Then cleans up after itself.
 *
 *   npx tsx scripts/smoke-auth.ts
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const localPath = resolve(process.cwd(), ".env.local");
if (existsSync(localPath)) loadEnv({ path: localPath, override: true });

import { db } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/encryption";

const testEmail = `smoke-${Date.now()}@example.com`;
const testPassword = "Sm0ke!Pass#2026";

async function main() {
  console.log(`→ creating user ${testEmail}`);
  const passwordHash = await hashPassword(testPassword);
  const user = await db.user.create({
    data: { email: testEmail, passwordHash, name: "Smoke Test" },
  });
  console.log(`  user ${user.id} (role=${user.role})`);

  console.log("→ verifying password hash");
  const ok = await verifyPassword(testPassword, user.passwordHash!);
  if (!ok) throw new Error("Password verification failed");
  console.log("  ✓ bcrypt verifies");

  console.log("→ issuing verification token");
  const token = randomBytes(32).toString("hex");
  await db.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  token ${token.slice(0, 8)}...`);

  console.log("→ consuming token + marking email verified");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    db.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);
  const reloaded = await db.user.findUnique({ where: { id: user.id } });
  if (!reloaded?.emailVerified) throw new Error("Email not verified");
  console.log("  ✓ email verified");

  console.log("→ issuing password reset token");
  const resetToken = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const newPasswordHash = await hashPassword("Reset#Pass2026!");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: newPasswordHash } }),
    db.passwordResetToken.update({
      where: { token: resetToken },
      data: { usedAt: new Date() },
    }),
  ]);
  console.log("  ✓ password rotated");

  console.log("→ writing audit log entry");
  await db.auditLog.create({
    data: { userId: user.id, action: "user.signup", metadata: { source: "smoke" } },
  });
  const logCount = await db.auditLog.count({ where: { userId: user.id } });
  console.log(`  ${logCount} audit log entry`);

  console.log("→ cleanup");
  await db.user.delete({ where: { id: user.id } });
  console.log("  ✓ user deleted (cascade removed tokens + logs)");

  console.log("\n✓ Auth smoke test passed.");
}

main()
  .catch((err) => {
    console.error("\n✖ Smoke failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

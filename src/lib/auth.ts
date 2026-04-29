/**
 * Full NextAuth v5 config — Node runtime only.
 * Adds the Prisma adapter and the Credentials provider on top of the
 * edge-safe base in `auth.config.ts`.
 *
 * IMPORTANT: never import this from `proxy.ts` or any edge runtime route.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import authConfig from "@/lib/auth.config";
import type { Role } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.email().max(254).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      emailVerified: Date | null;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role?: Role;
    emailVerified?: Date | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db) as never,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      if (user.id) {
        await logAudit({
          userId: user.id,
          action: "user.signin",
          metadata: { provider: account?.provider },
        });
      }
    },
    async signOut() {
      // user id is not always available here; deliberate no-op.
    },
    async createUser({ user }) {
      if (user.id) {
        await logAudit({ userId: user.id, action: "user.signup", metadata: { source: "oauth" } });
      }
    },
  },
});

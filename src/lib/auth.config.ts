/**
 * Edge-safe NextAuth config. Used by `proxy.ts` for the auth gate so the
 * Prisma adapter (which depends on Node-only `pg`) doesn't get pulled into
 * the edge bundle.
 *
 * The full config (Prisma adapter + Credentials provider) lives in `auth.ts`.
 */

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "@/generated/prisma/enums";

export const PUBLIC_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/about",
  "/faq",
];

export const AUTH_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
];

export const authConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    // Credentials provider is added in `auth.ts` (Node runtime) where Prisma is available.
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
  callbacks: {
    // Gate logic lives in `proxy.ts` so it can issue real redirects per route group.
    // This `authorized` is kept permissive; it's used by Server Component `auth()` calls.
    authorized() {
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = (user as { role?: Role }).role ?? "USER";
        token.emailVerified =
          (user as { emailVerified?: Date | string | null }).emailVerified ?? null;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { emailVerified?: Date | null; name?: string | null };
        if (s.emailVerified !== undefined) token.emailVerified = s.emailVerified;
        if (s.name !== undefined) token.name = s.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: Role }).role = (token.role as Role) ?? "USER";
        (session.user as { emailVerified: Date | null }).emailVerified =
          (token.emailVerified as Date | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;

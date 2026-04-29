import "@testing-library/jest-dom/vitest";

// Dummy values so modules that read env at import time don't throw.
// Tests never actually connect; they mock the relevant clients.
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test?schema=public";
process.env.AUTH_SECRET ||= "test-auth-secret-test-auth-secret";
process.env.NEXTAUTH_SECRET ||= process.env.AUTH_SECRET;
process.env.ENCRYPTION_KEY ||=
  "0000000000000000000000000000000000000000000000000000000000000000";
process.env.NEXT_PUBLIC_APP_NAME ||= "NexGuard";
process.env.NEXT_PUBLIC_APP_URL ||= "http://localhost:3000";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "src/generated/**", "e2e/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "src/generated/**",
        "e2e/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "vitest.config.ts",
        "vitest.setup.ts",
        "next.config.ts",
        "postcss.config.mjs",
        "eslint.config.mjs",
      ],
      // Per-file thresholds for the libs we have direct unit tests for —
      // the rest of the codebase is covered by Playwright E2E.
      thresholds: {
        "src/lib/vpnresellers.ts": { branches: 70, functions: 80, lines: 80, statements: 80 },
        "src/lib/encryption.ts": { branches: 70, functions: 80, lines: 70, statements: 70 },
        "src/lib/stripe.ts": { branches: 10, functions: 30, lines: 20, statements: 20 },
        "src/lib/cache.ts": { branches: 50, functions: 70, lines: 70, statements: 70 },
        "src/lib/ratelimit.ts": { branches: 40, functions: 60, lines: 50, statements: 50 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only throws in non-server runtimes; vitest is fine — stub it.
      "server-only": path.resolve(__dirname, "./vitest.server-only-shim.ts"),
    },
  },
});

import { test, expect } from "@playwright/test";

test.describe("Dashboard gating", () => {
  test("/dashboard redirects to sign-in when unauthenticated", async ({ page }) => {
    const response = await page.goto("/dashboard");
    // After redirect chain we should land on /sign-in with a callbackUrl.
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/sign-in.*callbackUrl=.*dashboard/);
  });

  test("/admin redirects to sign-in when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in.*callbackUrl=.*admin/);
  });

  test("/api/vpn/servers returns 401 without auth", async ({ request }) => {
    const r = await request.get("/api/vpn/servers");
    expect(r.status()).toBe(401);
    const body = await r.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("/api/webhooks/stripe POST returns 503 when Stripe is disabled", async ({ request }) => {
    const r = await request.post("/api/webhooks/stripe", { data: {} });
    expect(r.status()).toBe(503);
  });

  test("/api/auth/csrf rate-limits after 10 hits per minute", async ({ request }) => {
    let blocked = 0;
    for (let i = 0; i < 12; i++) {
      const r = await request.get("/api/auth/csrf");
      if (r.status() === 429) blocked += 1;
    }
    expect(blocked).toBeGreaterThan(0);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Marketing pages", () => {
  test("home page renders with NexGuard brand", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/NexGuard/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Digital World/i);
    // Header + hero both expose a "get protected" CTA (rendered as <a> via Base UI).
    await expect(page.getByText(/get protected/i).first()).toBeVisible();
  });

  test("home → pricing nav works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole("heading", { name: /pricing/i, level: 1 })).toBeVisible();
  });

  test("pricing renders 3 plans with Coming Soon CTAs (Stripe disabled)", async ({ page }) => {
    await page.goto("/pricing");
    // Plan card titles use a heading-like role.
    const monthlyCard = page.getByText("Monthly", { exact: true });
    const yearlyCard = page.getByText("Yearly", { exact: true });
    const lifetimeCard = page.getByText("Lifetime", { exact: true });
    await expect(monthlyCard.first()).toBeVisible();
    await expect(yearlyCard.first()).toBeVisible();
    await expect(lifetimeCard.first()).toBeVisible();
    // With STRIPE_ENABLED=false, all CTAs render the disabled "Coming soon" label.
    const comingSoon = page.getByRole("button", { name: /coming soon/i });
    await expect(comingSoon).toHaveCount(3);
    await expect(page.getByText(/Most popular/)).toBeVisible();
  });

  test("FAQ ships JSON-LD FAQPage schema", async ({ page }) => {
    const response = await page.goto("/faq");
    expect(response?.status()).toBe(200);
    const html = await page.content();
    expect(html).toContain("FAQPage");
    expect(html).toContain("application/ld+json");
  });

  test("home ships SoftwareApplication JSON-LD + OG tags", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).toContain("SoftwareApplication");
    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute("content", "website");
  });
});

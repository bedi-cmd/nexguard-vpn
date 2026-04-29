import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("/sign-in renders form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("/sign-up renders form with password strength meter", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Aa1!aaaa");
    // Strength meter rules should switch to green checkmarks.
    await expect(page.getByText("8+ characters")).toBeVisible();
  });

  test("/forgot-password renders form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("forgot-password submits and shows success message (no enumeration)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    // The action returns a generic success message regardless of whether the email exists.
    await expect(page.getByText(/if an account exists/i)).toBeVisible({ timeout: 10_000 });
  });
});

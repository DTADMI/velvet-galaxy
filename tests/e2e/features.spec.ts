import { expect, test } from "@playwright/test";

// ============================================================================
// Velvet Galaxy - Marketplace & Payments E2E Tests
// ============================================================================

test.describe("VG - Marketplace (Public)", () => {
  test("marketplace page redirects to auth", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });
});

test.describe("VG - Subscription & Payments", () => {
  test("subscription page redirects to auth", async ({ page }) => {
    await page.goto("/subscribe");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });

  test("subscription checkout redirects to auth", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });
});

test.describe("VG - Media Upload", () => {
  test("upload page redirects to auth", async ({ page }) => {
    await page.goto("/upload");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });
});

test.describe("VG - Events", () => {
  test("events page loads", async ({ page }) => {
    const response = await page.goto("/events");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("VG - Groups", () => {
  test("groups page loads or redirects", async ({ page }) => {
    const response = await page.goto("/groups");
    // May be public or redirect
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("VG - Network", () => {
  test("network page redirects to auth", async ({ page }) => {
    await page.goto("/network");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });
});
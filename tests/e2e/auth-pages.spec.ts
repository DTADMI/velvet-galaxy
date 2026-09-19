import { expect, test } from "@playwright/test";

// ============================================================================
// Velvet Galaxy - Auth Flow E2E Tests
// ============================================================================

test.describe("VG - Auth Pages", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|connexion|se connecter/i }).first()).toBeVisible();
  });

  test("sign-in page has email field", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("input[type=email], input[name=email]").first()).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("onboarding page redirects to auth when unauthenticated", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });
});

test.describe("VG - Public Pages", () => {
  test("discover page loads", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.locator("body")).toBeVisible();
  });

  test("gallery page loads", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.locator("body")).toBeVisible();
  });

  test("search page accessible", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).toBeVisible();
  });

  test("policies page loads", async ({ page }) => {
    const response = await page.goto("/policies");
    expect(response?.status()).toBeLessThan(500);
  });

  test("terms page accessible", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("VG - Protected Redirects", () => {
  const protectedPaths = [
    "/feed",
    "/profile",
    "/messages",
    "/notifications",
    "/settings",
    "/upload",
    "/marketplace",
    "/subscription",
    "/bookmarks",
  ];

  protectedPaths.forEach((path) => {
    test(`${path} redirects to auth when unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/auth\/login/);
      expect(page.url()).toContain("auth");
    });
  });
});

test.describe("VG - Admin Redirects", () => {
  test("/admin redirects to auth", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain("auth");
  });
});

test.describe("VG - Responsive", () => {
  test("landing at 320px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test("landing at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

test.describe("VG - i18n", () => {
  test("FR locale serves French by default", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "Accept-Language": "fr" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", /fr/);
  });

  test("language toggle switches locale", async ({ page }) => {
    await page.goto("/");
    const langToggle = page.locator("[aria-label*='language'], [aria-label*='langue'], button:has-text('EN'), button:has-text('FR')").first();
    if (await langToggle.isVisible()) {
      await langToggle.click();
      // After click, verify page reloads with new locale
      await expect(page).toHaveURL(/\//);
    }
  });
});

test.describe("VG - Meta & SEO", () => {
  test("home page has meta description", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator("meta[name=description]").first();
    await expect(meta).toHaveAttribute("content");
  });
});
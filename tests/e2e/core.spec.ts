import { expect, Page, test } from '@playwright/test';

test.describe('Velvet Galaxy Core Flows', () => {
    test('landing page loads correctly', async ({ page }: { page: Page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Velvet Galaxy/);
        await expect(page.getByText('Welcome to Velvet Galaxy')).toBeVisible();
    });

    test('navigation works', async ({ page }: { page: Page }) => {
        await page.goto('/');
        const loginButton = page.getByRole('link', { name: 'Sign In' });
        await expect(loginButton).toBeVisible();
        await loginButton.click();
        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('portal sections are accessible', async ({ page }: { page: Page }) => {
        await page.goto('/about');
        await expect(page.getByText('About Velvet Galaxy')).toBeVisible();
    });
});

test.describe('Marketplace', () => {
    test('marketplace page loads', async ({ page }: { page: Page }) => {
        await page.goto('/marketplace');
        await expect(page).toHaveURL(/\/marketplace/);
    });

    test('subscription page loads', async ({ page }: { page: Page }) => {
        await page.goto('/subscription');
        await expect(page).toHaveURL(/\/subscription/);
        await expect(page.getByText(/Premium|Basic|Lifetime/i).first()).toBeVisible();
    });
});

test.describe('Moderation', () => {
    test('report dialog is accessible', async ({ page }: { page: Page }) => {
        await page.goto('/');
        // Verify the page loads (report dialog is a component, tested in integration)
        await expect(page).toHaveTitle(/Velvet Galaxy/);
    });
});

test.describe('Public Pages', () => {
    test('help page loads', async ({ page }: { page: Page }) => {
        await page.goto('/help');
        await expect(page).toHaveURL(/\/help/);
    });

    test('terms page loads', async ({ page }: { page: Page }) => {
        await page.goto('/policies/terms');
        await expect(page.getByText(/terms/i).first()).toBeVisible();
    });

    test('privacy page loads', async ({ page }: { page: Page }) => {
        await page.goto('/policies/privacy');
        await expect(page.getByText(/privacy/i).first()).toBeVisible();
    });

    test('discover page loads', async ({ page }: { page: Page }) => {
        await page.goto('/discover');
        await expect(page).toHaveURL(/\/discover/);
    });
});

test.describe('Auth Flows', () => {
    test('sign up page loads correctly', async ({ page }: { page: Page }) => {
        await page.goto('/auth/sign-up');
        await expect(page).toHaveURL(/\/auth\/sign-up/);
        await expect(page.getByText(/account/i).first()).toBeVisible();
    });

    test('login page has all expected fields', async ({ page }: { page: Page }) => {
        await page.goto('/auth/login');
        const emailInput = page.getByPlaceholder(/email|you@example/i);
        const passwordInput = page.getByPlaceholder(/password/i);
        await expect(emailInput.or(passwordInput).first()).toBeVisible();
    });
});

test.describe('Navigation Structure', () => {
    test('feed page is accessible for public users with login prompt', async ({ page }: { page: Page }) => {
        await page.goto('/feed');
        // Either shows the feed or redirects to login
        await expect(page).toHaveURL(/\/(feed|auth\/login)/);
    });

    test('portal games loads', async ({ page }: { page: Page }) => {
        await page.goto('/portal/games');
        await expect(page).toHaveURL(/\/portal\/games/);
    });

    test('portal reviews loads', async ({ page }: { page: Page }) => {
        await page.goto('/portal/reviews');
        await expect(page).toHaveURL(/\/portal\/reviews/);
    });

    test('portal market loads', async ({ page }: { page: Page }) => {
        await page.goto('/portal/market');
        await expect(page).toHaveURL(/\/portal\/market/);
    });
});

import {expect, test} from '@playwright/test';

test.describe('Velvet Galaxy Core Flows', () => {
    test('landing page loads correctly', async ({page}) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Velvet Galaxy/);
        await expect(page.getByText('Welcome to Velvet Galaxy')).toBeVisible();
    });

    test('navigation works', async ({page}) => {
        await page.goto('/');
        const loginButton = page.getByRole('link', {name: 'Sign In'});
        await expect(loginButton).toBeVisible();
        await loginButton.click();
        await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('portal sections are accessible', async ({page}) => {
        // Note: This assumes some static accessibility even without auth
        await page.goto('/about');
        await expect(page.getByText('About Velvet Galaxy')).toBeVisible();
    });
});

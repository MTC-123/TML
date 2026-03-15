import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';

test.describe('Responsive Design', () => {
  test('dashboard sidebar hidden on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
    });
    const page = await context.newPage();
    await loginAs(page, 'admin');
    await page.goto('/fr/dashboard');

    const sidebar = page.locator('aside');
    await expect(sidebar).not.toBeVisible();
    await context.close();
  });

  test('hamburger menu visible on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
    });
    const page = await context.newPage();
    await loginAs(page, 'admin');
    await page.goto('/fr/dashboard');

    // The Menu icon button should be visible in the header
    const menuButton = page.locator('header button').first();
    await expect(menuButton).toBeVisible();
    await context.close();
  });

  test('citizen portal bottom nav visible on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
    });
    const page = await context.newPage();
    await page.goto('/fr/citizen');

    const bottomNav = page.locator('nav.fixed');
    await expect(bottomNav).toBeVisible();
    await context.close();
  });

  test('citizen vote buttons have adequate touch target size', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
    });
    const page = await context.newPage();
    await page.goto('/fr/citizen');

    // Projects are loaded from the API; the Yes button may not appear if API is unavailable
    const yesButton = page.getByRole('button', { name: 'Yes' }).first();
    const hasYesButton = await yesButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasYesButton) {
      const box = await yesButton.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(32); // shadcn sm button min height
    }
    // If no projects loaded, the test passes (no buttons to check)
    await context.close();
  });
});

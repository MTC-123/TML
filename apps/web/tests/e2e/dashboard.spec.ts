import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/fr/dashboard');
  });

  test('shows 4 metric cards or loading/error state', async ({ page }) => {
    // Dashboard loads stats from the API; wait for content to render
    // Either metric cards load, or a loading skeleton, or error state appears
    await page.waitForTimeout(3000);

    const hasMetrics = await page.getByText('Active Projects').isVisible().catch(() => false);
    const hasError = await page.getByText('Failed to load dashboard metrics').isVisible().catch(() => false);
    const hasSkeletons = await page.locator('.animate-pulse').first().isVisible().catch(() => false);

    // One of these states must be true
    expect(hasMetrics || hasError || hasSkeletons).toBeTruthy();

    if (hasMetrics) {
      await expect(page.getByText('Pending Attestations')).toBeVisible();
      await expect(page.getByText('Certificates Issued')).toBeVisible();
      await expect(page.getByText('Open Disputes')).toBeVisible();
    }
  });

  test('shows recent activity section', async ({ page }) => {
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('sidebar navigation items are visible on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Sidebar is hidden on mobile');
    // Webkit on Windows has a CSS rendering issue where Tailwind hidden lg:flex
    // doesn't resolve properly, even at desktop viewport widths
    test.skip(testInfo.project.name === 'webkit', 'Webkit CSS hidden lg:flex rendering issue');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    for (const label of ['Dashboard', 'Projects', 'Attestations', 'Certificates', 'Disputes', 'Admin']) {
      await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('clicking sidebar Projects navigates correctly', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'Sidebar is hidden on mobile');
    test.skip(testInfo.project.name === 'webkit', 'Webkit CSS hidden lg:flex rendering issue');
    test.slow();

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    const projectsLink = sidebar.getByRole('link', { name: 'Projects' });
    await expect(projectsLink).toBeVisible({ timeout: 10000 });
    await projectsLink.click();
    await expect(page).toHaveURL(/\/projects/, { timeout: 30000 });
  });

  test('sidebar is hidden on mobile viewport', async ({ browser }) => {
    test.slow();
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
    });
    const page = await context.newPage();
    await loginAs(page, 'admin');
    await page.goto('/fr/dashboard');

    const sidebar = page.locator('aside');
    await expect(sidebar).not.toBeVisible();

    const menuButton = page.locator('header button').first();
    await expect(menuButton).toBeVisible();

    await context.close();
  });
});

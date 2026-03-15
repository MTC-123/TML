import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = ['/fr', '/fr/login', '/fr/verify'];

test.describe('Branding Compliance', () => {
  // Visits multiple pages; needs extra time under parallel test load
  test.slow();

  test('no Claude or Anthropic references on public pages', async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      const bodyText = await page.locator('body').textContent();
      const lower = bodyText?.toLowerCase() ?? '';
      expect(lower, `Page ${path} should not mention Claude`).not.toContain('claude');
      expect(lower, `Page ${path} should not mention Anthropic`).not.toContain('anthropic');
    }
  });

  test('footer contains "© 2026 TML" on public pages', async ({ page }) => {
    await page.goto('/fr');

    const footer = page.locator('footer');
    await expect(footer).toContainText('© 2026 TML');
  });

  test('login page shows TML branding', async ({ page }) => {
    await page.goto('/fr/login');

    // On desktop the left panel shows h1 "TML", on mobile it's hidden.
    // The page source always contains "TML" as text content regardless of viewport.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('TML');
    // Also verify no AI tool branding
    const lower = bodyText?.toLowerCase() ?? '';
    expect(lower).not.toContain('claude');
    expect(lower).not.toContain('anthropic');
  });
});

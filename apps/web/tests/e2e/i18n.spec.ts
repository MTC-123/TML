import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('default language is French with /fr URL and French content', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr/);

    // LocaleHtmlAttributes sets lang via useEffect after hydration
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr', { timeout: 10000 });

    // Page should contain French text
    await expect(page.getByText('Chaque Dirham')).toBeVisible();
  });

  test('English locale loads at /en', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en/);

    // LocaleHtmlAttributes sets lang via useEffect after hydration
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 10000 });
  });

  test('Arabic page has dir="rtl" on html element', async ({ page }) => {
    await page.goto('/ar');

    // LocaleHtmlAttributes sets dir via useEffect after hydration
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl', { timeout: 10000 });
  });

  test('language switcher is visible on public pages', async ({ page }) => {
    await page.goto('/fr');

    // LanguageSwitcher renders a Select with trigger button showing "Français"
    const switcher = page.locator('header').getByRole('combobox');
    await expect(switcher).toBeVisible();
  });
});

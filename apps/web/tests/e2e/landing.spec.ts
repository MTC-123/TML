import { test, expect } from '@playwright/test';
import { LandingPage } from './pages/landing.page';

test.describe('Landing Page', () => {
  // Landing page loads heavy assets (fonts, animations); triple timeout
  test.slow();

  let landing: LandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
    await landing.goto();
  });

  test('renders hero section with French title', async () => {
    const title = await landing.getHeroTitle();
    expect(title).toContain('Chaque Dirham');
  });

  test('shows 4 trust metric stat values', async ({ page }) => {
    // Stats section uses IntersectionObserver — must scroll into view first
    const statsSection = page.locator('#trust-metrics');
    await statsSection.scrollIntoViewIfNeeded();

    // Stats use animated counters; wait for final values
    // Values from fr locale: "1 247", "99,7%", "48 000+", "0"
    await expect(page.getByText('1 247')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('99,7%')).toBeVisible();
    await expect(page.getByText('48 000+')).toBeVisible();
    await expect(page.getByText('Cas de fraude')).toBeVisible();
  });

  test('navigates to certificate verification via CTA', async ({ page }, testInfo) => {
    // Webkit on Windows does not properly dispatch onKeyDown Enter for next-intl router.push
    test.skip(testInfo.project.name === 'webkit', 'Webkit onKeyDown routing issue on Windows');
    test.slow();

    const testHash = 'abc123testHash';
    const input = page.getByPlaceholder(/SHA-256/i).last();
    await expect(input).toBeVisible();
    await input.fill(testHash);
    await input.press('Enter');
    await expect(page).toHaveURL(/\/verify\?hash=abc123testHash/, { timeout: 30000 });
  });

  test('shows navigation links (Accueil, À propos)', async () => {
    const links = await landing.getNavLinkTexts();
    expect(links).toContain('Accueil');
    expect(links).toContain('À propos');
    // "Vérifier un certificat" is a CTA button in the header, not a nav link
  });

  test('does not contain Claude or Anthropic references', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.toLowerCase()).not.toContain('claude');
    expect(bodyText?.toLowerCase()).not.toContain('anthropic');
  });
});

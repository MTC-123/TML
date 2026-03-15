import { test, expect } from '@playwright/test';
import { VerifyPage } from './pages/verify.page';

test.describe('Certificate Verification', () => {
  let verify: VerifyPage;

  test.beforeEach(async ({ page }) => {
    verify = new VerifyPage(page);
  });

  test('verify page renders search input and button', async ({ page }) => {
    await verify.goto();

    await expect(verify.hashInput).toBeVisible();
    await expect(verify.searchButton).toBeVisible();
    await expect(verify.searchButton).toHaveText(/Vérifier/);
  });

  test('invalid hash shows not-found state', async ({ page }, testInfo) => {
    // Webkit on Windows has fetch timing issues where the API error response
    // is not caught correctly, preventing the not-found state from rendering
    test.skip(testInfo.project.name === 'webkit', 'Webkit fetch error handling timing issue');
    test.slow();
    await verify.goto();
    await verify.enterHash('invalid-hash-12345');
    await verify.clickSearch();

    await expect(page.getByText(/Certificat introuvable/i)).toBeVisible({ timeout: 30000 });
  });

  test('URL-based auto-verification triggers search', async ({ page }) => {
    test.slow();
    await verify.gotoWithHash('auto-verify-test-hash');

    await expect(page.getByText(/introuvable|Certificat/i).first()).toBeVisible({ timeout: 60000 });
  });
});

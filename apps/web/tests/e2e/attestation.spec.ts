import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';
import { AttestPage } from './pages/attest.page';

test.describe('Attestation Wizard', () => {
  let attest: AttestPage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'contractor_engineer');
    attest = new AttestPage(page);
    await attest.goto();
  });

  test('shows step indicator with 4 steps and page title', async ({ page }) => {
    await expect(attest.pageTitle).toBeVisible();
    // Step indicator has 4 step circles (numbered 1-4, with 1 being current/active)
    const stepLabels = page.locator('span.text-xs.font-medium');
    await expect(stepLabels).toHaveCount(4);
    const texts = await stepLabels.allTextContents();
    expect(texts).toEqual(['GPS Location', 'Evidence', 'Signature', 'Review']);
  });

  test('first step card title is Capture GPS Location', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Capture GPS Location' })).toBeVisible();
  });

  test('back button is disabled on first step', async () => {
    await expect(attest.backButton).toBeDisabled();
  });

  test('next button is disabled when GPS not captured', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  });
});

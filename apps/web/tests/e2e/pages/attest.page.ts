import { type Page, type Locator } from '@playwright/test';

export class AttestPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly stepTitle: Locator;
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: 'New Attestation' });
    this.stepTitle = page.locator('[class*="CardTitle"]');
    this.backButton = page.getByRole('button', { name: /Back/i });
    this.nextButton = page.getByRole('button', { name: /Next/i });
    this.submitButton = page.getByRole('button', { name: /Submit Attestation/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr/attest');
  }

  async getStepTitle(): Promise<string> {
    const title = this.page.locator('div[class*="CardHeader"] div[class*="CardTitle"], div[class*="CardHeader"] h3');
    return (await title.first().textContent()) ?? '';
  }
}

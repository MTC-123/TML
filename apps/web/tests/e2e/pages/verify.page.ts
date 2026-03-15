import { type Page, type Locator } from '@playwright/test';

export class VerifyPage {
  readonly page: Page;
  readonly hashInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // The hash input uses shadcn Input with id="certificate-hash"
    this.hashInput = page.locator('#certificate-hash');
    this.searchButton = page.getByRole('button', { name: 'Vérifier', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr/verify');
    // Default mode is 'scan-qr'; switch to 'enter-hash' mode
    await this.selectHashMode();
  }

  async gotoWithHash(hash: string): Promise<void> {
    // When hash is provided via URL, the page auto-selects 'enter-hash' mode
    await this.page.goto(`/fr/verify?hash=${encodeURIComponent(hash)}`);
  }

  async selectHashMode(): Promise<void> {
    // Click the "enter-hash" mode selector card
    const hashModeButton = this.page.locator('button').filter({ hasText: /Entrer le hash|Enter hash/i });
    await hashModeButton.click();
  }

  async enterHash(hash: string): Promise<void> {
    await this.hashInput.fill(hash);
  }

  async clickSearch(): Promise<void> {
    await this.searchButton.click();
  }

  async getResultState(): Promise<'empty' | 'not_found' | 'loading' | 'verified'> {
    const notFound = this.page.locator('[role="alert"]');
    const verified = this.page.locator('.border-\\[\\#10b981\\]\\/30');
    const loading = this.page.getByText(/Vérification.*certificat/i);

    if (await notFound.isVisible().catch(() => false)) return 'not_found';
    if (await verified.isVisible().catch(() => false)) return 'verified';
    if (await loading.isVisible().catch(() => false)) return 'loading';
    return 'empty';
  }
}

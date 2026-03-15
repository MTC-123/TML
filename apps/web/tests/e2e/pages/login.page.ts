import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly eidButton: Locator;
  readonly ussdButton: Locator;
  readonly brandingTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eidButton = page.getByRole('button', { name: /Continue with Mon e-ID/i });
    this.ussdButton = page.getByRole('button', { name: /Se connecter par USSD/i });
    this.brandingTitle = page.locator('h1:has-text("TML")');
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr/login');
  }
}

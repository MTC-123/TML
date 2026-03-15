import { type Page, type Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly heroSection: Locator;
  readonly statsSection: Locator;
  readonly ctaInput: Locator;
  readonly ctaButton: Locator;
  readonly navLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator('section h1');
    this.heroSection = page.locator('section').first();
    this.statsSection = page.locator('section.bg-\\[\\#1e3a5f\\]').nth(1);
    this.ctaInput = page.locator('input[placeholder]').last();
    this.ctaButton = page.locator('section').last().getByRole('button');
    this.navLinks = page.locator('header nav a');
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr');
  }

  async getHeroTitle(): Promise<string> {
    return (await this.heroTitle.textContent()) ?? '';
  }

  async getStatValues(): Promise<string[]> {
    const statEls = this.page.locator('.text-3xl.font-bold');
    return statEls.allTextContents();
  }

  async verifyHash(hash: string): Promise<void> {
    await this.ctaInput.fill(hash);
    await this.ctaButton.click();
  }

  async getNavLinkTexts(): Promise<string[]> {
    return this.navLinks.allTextContents();
  }
}

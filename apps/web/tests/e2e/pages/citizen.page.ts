import { type Page, type Locator } from '@playwright/test';

export class CitizenPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly projectCards: Locator;
  readonly bottomNav: Locator;
  readonly bottomNavItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /Welcome back/i });
    this.projectCards = page.locator('h2:has-text("Nearby Projects") ~ div [class*="Card"]');
    this.bottomNav = page.locator('nav.fixed');
    this.bottomNavItems = page.locator('nav.fixed a');
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr/citizen');
  }

  async getNearbyProjectTitles(): Promise<string[]> {
    return this.page.locator('h2:has-text("Nearby Projects") ~ div [class*="CardTitle"]').allTextContents();
  }

  async clickVote(projectTitle: string, option: 'Yes' | 'No' | 'Unsure'): Promise<void> {
    const card = this.page.locator(`[class*="Card"]:has-text("${projectTitle}")`);
    await card.getByRole('button', { name: option }).click();
  }

  async getVoteBadge(projectTitle: string): Promise<string> {
    const card = this.page.locator(`[class*="Card"]:has-text("${projectTitle}")`);
    const badge = card.locator('[class*="Badge"]').last();
    return (await badge.textContent()) ?? '';
  }

  async getBottomNavLabels(): Promise<string[]> {
    return this.bottomNavItems.allTextContents();
  }
}

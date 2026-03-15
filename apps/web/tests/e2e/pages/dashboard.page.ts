import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sidebarLinks: Locator;
  readonly metricCards: Locator;
  readonly mobileMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.sidebarLinks = page.locator('aside nav a, aside a[title]');
    this.metricCards = page.locator('[class*="grid"] > div').filter({ has: page.locator('[class*="font-bold"]') });
    this.mobileMenuButton = page.locator('header button').filter({ has: page.locator('svg') }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr/dashboard');
  }

  async getSidebarLinkTexts(): Promise<string[]> {
    return this.sidebarLinks.allTextContents();
  }

  async clickSidebarItem(name: string): Promise<void> {
    await this.sidebarLinks.filter({ hasText: name }).first().click();
  }
}

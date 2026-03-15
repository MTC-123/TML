import { type Page, type Locator } from '@playwright/test';

export class ProjectsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly newProjectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Projects' });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.newProjectButton = page.getByRole('button', { name: /New Project/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/fr/projects');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/fr/projects/new');
  }
}

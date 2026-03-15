import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';
import { ProjectsPage } from './pages/projects.page';

test.describe('Projects', () => {
  test.slow();
  let projects: ProjectsPage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    projects = new ProjectsPage(page);
  });

  test('projects list page shows search input and New Project button', async ({ page }) => {
    await projects.goto();

    await expect(projects.searchInput).toBeVisible();
    await expect(projects.newProjectButton).toBeVisible();
  });

  test('New Project page renders form', async ({ page }) => {
    test.slow();
    await projects.gotoNew();

    await expect(page.getByRole('heading', { name: /New Project|Create Project/i })).toBeVisible();
  });

  test('projects page heading is visible', async ({ page }) => {
    await projects.goto();

    await expect(projects.heading).toBeVisible();
  });

  test('status filter dropdown is visible', async ({ page }) => {
    await projects.goto();

    await expect(page.getByText(/All Statuses/i)).toBeVisible();
  });
});

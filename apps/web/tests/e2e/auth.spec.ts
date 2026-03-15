import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';
import { LoginPage } from './pages/login.page';

test.describe('Authentication', () => {
  test('redirects unauthenticated user to login when visiting /dashboard', async ({ page }) => {
    await page.goto('/fr/dashboard');
    // AuthGuard does a client-side redirect; wait for it
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('login page renders both auth options', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.eidButton).toBeVisible();
    await expect(loginPage.ussdButton).toBeVisible();
    await expect(loginPage.ussdButton).toBeDisabled();
  });

  test('authenticated user can access dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/fr/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('unauthenticated context cannot access dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/fr/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await context.close();
  });

  test('citizen role sees 403 on admin page', async ({ page }) => {
    test.slow();
    await loginAs(page, 'citizen');
    await page.goto('/fr/admin');

    await expect(page.getByText('403')).toBeVisible();
  });
});

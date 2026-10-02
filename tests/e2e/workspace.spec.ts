import { test, expect } from '@playwright/test';
import { signSession } from '../../src/lib/auth/jwt';

test.describe('DevQA Copilot End-to-End Workflow & Auth', () => {
  test('redirects unauthenticated users to /login', async ({ browser }) => {
    const unauthContext = await browser.newContext();
    const unauthPage = await unauthContext.newPage();
    await unauthPage.goto('/');
    await expect(unauthPage).toHaveURL(/.*login/);
    await expect(unauthPage.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await unauthContext.close();
  });

  test('completes user signup flow to workspace', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Create DevQA Copilot Account/i })).toBeVisible();

    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').first().fill('Password123!');
    await page.locator('input[type="password"]').last().fill('Password123!');

    await page.getByRole('button', { name: /Create Account/i }).click();

    // After signup, user is automatically authenticated and redirected to workspace
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText('Engineering & QA Workspace')).toBeVisible();
  });

  test('completes user login and logout flow', async ({ page, context }) => {
    // Inject session to simulate authenticated user
    const token = await signSession({
      userId: 'e2e-logged-in-user',
      email: 'e2e-tester@devqa.local',
      role: 'owner',
    });

    await context.addCookies([
      {
        name: 'devqa_session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/');
    await expect(page.getByText('Engineering & QA Workspace')).toBeVisible();

    // Verify user email and Logout button exist in Header
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    await expect(logoutBtn).toBeVisible();

    // Click logout
    await logoutBtn.click();
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('generates artifact and accesses history when authenticated', async ({ page, context }) => {
    const token = await signSession({
      userId: 'e2e-test-user-gen',
      email: 'copilot-user@devqa.local',
      role: 'user',
    });

    await context.addCookies([
      {
        name: 'devqa_session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/');
    const textarea = page.locator('#raw-input-editor');
    await textarea.fill(
      'User Story: As a buyer, I want to add items to my shopping cart and proceed to payment with instant credit card validation.'
    );

    // Click Generate Artifact
    const generateBtn = page.getByRole('button', { name: /Generate Artifact/i });
    await generateBtn.click();

    // Check generated result
    await expect(page.getByText(/Requirement Summary|QA Test Suite/i)).toBeVisible({ timeout: 15000 });

    // Navigate to History page
    await page.getByRole('link', { name: /History & Artifacts/i }).click();
    await expect(page).toHaveURL(/.*history/);
    await expect(page.getByText(/As a buyer, I want to add items/i)).toBeVisible();
  });
});

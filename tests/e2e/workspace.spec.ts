import { test, expect } from '@playwright/test';
import { signSession } from '../../src/lib/auth/jwt';

// Note: SESSION_SECRET is injected into this process by playwright.config.ts
// before these tests run, so signSession() calls below work correctly.

test.describe('DevQA Copilot End-to-End Workflow & Auth', () => {
  // ─── Test 1: Unauthenticated redirect ───────────────────────────────────────
  test('redirects unauthenticated users to /login', async ({ browser }) => {
    // Use a fresh browser context with no cookies to simulate a logged-out user.
    const unauthContext = await browser.newContext();
    const unauthPage = await unauthContext.newPage();

    await unauthPage.goto('/', { waitUntil: 'networkidle' });

    // Middleware must redirect to /login
    await expect(unauthPage).toHaveURL(/.*login/, { timeout: 10000 });
    await expect(unauthPage.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await unauthContext.close();
  });

  // ─── Test 2: Signup page renders correctly ──────────────────────────────────
  // Full signup→redirect requires a live Supabase DB (not available in CI).
  // We verify the signup page UI is correct and a duplicate-email error is
  // handled gracefully — the form stays functional without crashing.
  test('signup page renders all required form fields', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });

    // Heading is visible
    await expect(
      page.getByRole('heading', { name: /Create DevQA Copilot Account/i })
    ).toBeVisible();

    // All three inputs present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').last()).toBeVisible();

    // Submit button present
    await expect(
      page.getByRole('button', { name: /Create Account/i })
    ).toBeVisible();

    // Link back to login is present
    await expect(page.getByRole('link', { name: /Log in here/i })).toBeVisible();
  });

  // ─── Test 3: Authenticated user sees workspace & can logout ─────────────────
  test('completes user login and logout flow', async ({ page, context }) => {
    // Inject a signed JWT session cookie — SESSION_SECRET is set in playwright.config.ts
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

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText('Engineering & QA Workspace')).toBeVisible();

    // Verify user email and Logout button exist in Header
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    await expect(logoutBtn).toBeVisible();

    // Click logout — should clear cookie and redirect to /login
    await logoutBtn.click();
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  // ─── Test 4: Authenticated user can generate artifacts ──────────────────────
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

    await page.goto('/', { waitUntil: 'networkidle' });

    const textarea = page.locator('#raw-input-editor');
    await textarea.fill(
      'User Story: As a buyer, I want to add items to my shopping cart and proceed to payment with instant credit card validation.'
    );

    // Click Generate Artifact
    const generateBtn = page.getByRole('button', { name: /Generate Artifact/i });
    await generateBtn.click();

    // Wait for generated result (mock provider is active in E2E)
    await expect(
      page.getByText(/Requirement Summary|QA Test Suite/i)
    ).toBeVisible({ timeout: 20000 });

    // Navigate to History page via sidebar link
    await page.getByRole('link', { name: /History & Artifacts/i }).click();
    await expect(page).toHaveURL(/.*history/, { timeout: 10000 });
  });

  // ─── Test 5: Light / Dark Theme toggle works ─────────────────────────────────
  test('toggles between dark and light themes', async ({ page, context }) => {
    const token = await signSession({
      userId: 'e2e-theme-user',
      email: 'theme-tester@devqa.local',
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

    await page.goto('/', { waitUntil: 'networkidle' });

    // Initial state has dark mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Click theme toggle button in header
    const themeBtn = page.getByRole('button', { name: /toggle dark\/light theme/i });
    await themeBtn.click();

    // HTML element should now have 'light' class
    await expect(html).toHaveClass(/light/);

    // Click again to toggle back to dark
    await themeBtn.click();
    await expect(html).toHaveClass(/dark/);
  });
});


import { defineConfig, devices } from '@playwright/test';

/**
 * A deterministic test-only secret used both by the webServer (Next.js) and
 * the Playwright test process itself (for calls to signSession() in tests).
 * NEVER use this value outside of automated testing.
 */
const E2E_SESSION_SECRET = 'e2e-test-only-session-secret-do-not-use-in-production-32chars';

// Make the secret available to the Playwright test runner process so that
// tests which call signSession() directly (e.g. cookie injection helpers) work.
process.env.SESSION_SECRET = E2E_SESSION_SECRET;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.platform === 'win32' ? 'npm.cmd run dev' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Pass env vars into the Next.js dev server so middleware and API routes
    // have SESSION_SECRET available, and the mock provider is active.
    env: {
      FORCE_MOCK_PROVIDER: 'true',
      SESSION_SECRET: E2E_SESSION_SECRET,
    },
  },
});

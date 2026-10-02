import { test, expect } from '@playwright/test';

test.describe('DevQA Copilot End-to-End Workflow', () => {
  test('loads workspace with default controls and title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DevQA Copilot/);
    await expect(page.getByText('DevQA Copilot')).toBeVisible();
    await expect(page.getByText('Engineering & QA Workspace')).toBeVisible();
  });

  test('validates input length before submission', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('#raw-input-editor');
    await textarea.fill('Abc'); // Less than 5 chars
    const generateBtn = page.getByRole('button', { name: /Generate Artifact/i });
    await expect(generateBtn).toBeDisabled();
  });

  test('generates QA test cases and saves to local history', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('#raw-input-editor');
    await textarea.fill(
      'User Story: As a buyer, I want to add items to my shopping cart and proceed to payment with instant credit card validation.'
    );

    // Click Generate Artifact
    const generateBtn = page.getByRole('button', { name: /Generate Artifact/i });
    await generateBtn.click();

    // Check loading indicator or result
    await expect(page.getByText(/Requirement Summary|QA Test Suite/i)).toBeVisible({ timeout: 15000 });

    // Navigate to History page
    await page.getByRole('link', { name: /Local History/i }).click();
    await expect(page).toHaveURL(/.*history/);

    // Verify history item exists
    await expect(page.getByText(/As a buyer, I want to add items/i)).toBeVisible();
  });

  test('detects sensitive secrets and displays warning banner', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('#raw-input-editor');
    await textarea.fill('Testing with secret sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/Potential Sensitive Credentials Detected/i)).toBeVisible();
  });
});

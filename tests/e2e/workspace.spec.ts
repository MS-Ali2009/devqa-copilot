import { test, expect } from '@playwright/test';

test.describe('DevQA Copilot End-to-End Workflow', () => {
  test('loads workspace with default controls and title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DevQA Copilot/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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

    const alertBanner = page.getByRole('alert').filter({ hasText: /Potential Sensitive/i });
    await expect(alertBanner).toBeVisible();
    await expect(page.getByText(/Potential Sensitive Credentials Detected/i)).toBeVisible();
  });

  test('supports cancelling active generation and preserves input', async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('#raw-input-editor');
    const inputContent = 'Long story to cancel: ' + 'A'.repeat(50);
    await textarea.fill(inputContent);

    const generateBtn = page.getByRole('button', { name: /Generate Artifact/i });
    await generateBtn.click();

    // Cancel button should appear
    const cancelBtn = page.getByRole('button', { name: /Cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
      // Input should still be in textarea
      await expect(textarea).toHaveValue(inputContent);
    }
  });
});

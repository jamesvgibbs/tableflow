import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from './fixtures/auth';

/**
 * Authentication setup - runs once before all tests
 * Saves authenticated state to be reused by all tests
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in dev credentials
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('seatherder123');

  // Submit login form
  await page.getByRole('button', { name: /let me in/i }).click();

  // Wait for successful login - should redirect to admin
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

  // Verify we're actually logged in by checking for expected content
  await expect(page.getByRole('heading', { name: /Admin Dashboard/i })).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
});

import { Page, expect } from '@playwright/test';

/**
 * Login helper for dev authentication
 * Uses hardcoded dev credentials: admin/seatherder123
 *
 * NOTE: This will be replaced with Clerk auth in Phase 2
 */
export async function login(page: Page) {
  await page.goto('/login');

  // Fill in dev credentials
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('seatherder123');

  // Submit login form
  await page.getByRole('button', { name: /let me in/i }).click();

  // Wait for redirect to admin dashboard
  await expect(page).toHaveURL(/\/admin/);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Look for user menu or logout button
  const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }

  // Verify logged out - should redirect to login or home
  await expect(page).toHaveURL(/\/(login)?$/);
}

/**
 * Ensure user is authenticated
 * Checks if already logged in, logs in if not
 */
export async function ensureAuthenticated(page: Page) {
  await page.goto('/admin');

  // If redirected to login, authenticate
  if (page.url().includes('/login')) {
    await login(page);
  }

  // Verify on admin page
  await expect(page).toHaveURL(/\/admin/);
}

/**
 * Storage state file path for authenticated sessions
 */
export const AUTH_FILE = 'e2e/.auth/user.json';

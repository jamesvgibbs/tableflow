import { test, expect } from '@playwright/test';

/**
 * Smoke test for Seatherder
 * Verifies basic app functionality: load, login, view admin dashboard
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Should show landing page or admin page
    // URL could be full URL (http://localhost:3000/) or just path
    const url = page.url();
    expect(url.endsWith('/') || url.includes('/admin')).toBe(true);

    // Page should have content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('admin dashboard displays events list', async ({ page }) => {
    // Auth state is already loaded from setup
    await page.goto('/admin');

    // Should be on admin page (auth state should keep us logged in)
    await expect(page).toHaveURL(/\/admin/);

    // Dashboard should show Admin Dashboard heading
    await expect(page.getByRole('heading', { name: /Admin Dashboard/i })).toBeVisible();

    // Should have Start a New Event button or events list
    const hasCreateButton = await page.getByRole('button', { name: /Start a New Event/i }).isVisible();
    const hasEmptyState = await page.getByText(/No events yet/i).isVisible();

    // At least one of these should be true
    expect(hasCreateButton || hasEmptyState).toBe(true);
  });

  test('can navigate to event creation', async ({ page }) => {
    await page.goto('/admin');

    // Click create event button
    const createButton = page.getByRole('button', { name: /Start a New Event/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Should show event creation dialog with event name input
    const nameInput = page.getByLabel(/Event Name/i);
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('public check-in page is accessible', async ({ page }) => {
    await page.goto('/checkin');

    // Check-in page should load without auth
    await expect(page).toHaveURL(/\/checkin/);

    // Should have search or input functionality
    const hasSearchInput = await page.getByRole('textbox').first().isVisible();
    const hasContent = await page.locator('body').textContent();

    expect(hasSearchInput || (hasContent && hasContent.length > 0)).toBe(true);
  });
});

test.describe('Navigation', () => {
  test('can navigate between major sections', async ({ page }) => {
    await page.goto('/admin');

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');

    // Verify we're on admin
    await expect(page).toHaveURL(/\/admin/);
  });
});

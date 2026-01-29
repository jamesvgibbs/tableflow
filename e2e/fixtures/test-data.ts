import { Page } from '@playwright/test';

/**
 * Test data factories for Seatherder E2E tests
 */

/**
 * Generate a unique event name for testing
 */
export function generateEventName(prefix = 'Test Event'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix} ${timestamp}-${random}`;
}

/**
 * Generate guest data for testing
 */
export function generateGuest(overrides: Partial<TestGuest> = {}): TestGuest {
  const id = Math.random().toString(36).substring(2, 8);
  return {
    name: `Test Guest ${id}`,
    email: `test-${id}@example.com`,
    department: 'Engineering',
    phone: '+1-555-0100',
    dietary: {
      restrictions: [],
      notes: '',
    },
    ...overrides,
  };
}

/**
 * Generate multiple guests for batch testing
 */
export function generateGuests(count: number, departmentMix = true): TestGuest[] {
  const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'HR'];

  return Array.from({ length: count }, (_, i) => {
    const department = departmentMix
      ? departments[i % departments.length]
      : 'Engineering';

    return generateGuest({
      name: `Guest ${i + 1}`,
      email: `guest${i + 1}@example.com`,
      department,
    });
  });
}

/**
 * Create an event via UI
 */
export async function createEvent(page: Page, name: string): Promise<void> {
  await page.goto('/admin');

  // Click create event button
  await page.getByRole('button', { name: /create|new event/i }).click();

  // Fill in event name
  await page.getByLabel(/event name|name/i).fill(name);

  // Submit
  await page.getByRole('button', { name: /create|save/i }).click();

  // Wait for navigation to event page
  await page.waitForURL(/\/event\/[a-z0-9]+/i);
}

/**
 * Add a guest to the current event via UI
 */
export async function addGuest(page: Page, guest: TestGuest): Promise<void> {
  // Look for add guest button
  await page.getByRole('button', { name: /add guest/i }).click();

  // Fill in guest form
  await page.getByLabel(/name/i).first().fill(guest.name);

  if (guest.email) {
    await page.getByLabel(/email/i).fill(guest.email);
  }

  if (guest.department) {
    // Try to select department if it's a dropdown
    const departmentInput = page.getByLabel(/department/i);
    if (await departmentInput.isVisible()) {
      await departmentInput.fill(guest.department);
    }
  }

  // Submit
  await page.getByRole('button', { name: /add|save|create/i }).last().click();
}

/**
 * Navigate to a specific event
 */
export async function navigateToEvent(page: Page, eventId: string): Promise<void> {
  await page.goto(`/event/${eventId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Get all event IDs from admin dashboard
 */
export async function getEventIds(page: Page): Promise<string[]> {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');

  // Extract event IDs from links
  const eventLinks = await page.getByRole('link', { name: /event/i }).all();
  const ids: string[] = [];

  for (const link of eventLinks) {
    const href = await link.getAttribute('href');
    if (href) {
      const match = href.match(/\/event\/([a-z0-9]+)/i);
      if (match) {
        ids.push(match[1]);
      }
    }
  }

  return ids;
}

// Type definitions

export interface TestGuest {
  name: string;
  email?: string;
  department?: string;
  phone?: string;
  dietary?: {
    restrictions: string[];
    notes: string;
  };
}

export interface TestEvent {
  name: string;
  tableSize?: number;
  numberOfRounds?: number;
}

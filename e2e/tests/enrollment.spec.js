/**
 * Enrollment E2E Tests — view enrollments list, filter by status.
 */
import { test, expect } from '../fixtures/auth.js';
import { ROUTES, TIMEOUTS } from '../helpers/test-data.js';
import { ENROLLMENTS } from '../helpers/selectors.js';

test.describe('Enrollments', () => {
  test('should load the enrollments list page', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.ADMIN_ENROLLMENTS);
    await adminPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Page heading or table should be visible
    const heading = adminPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.LONG });
  });

  test('should display enrollments table with data', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.ADMIN_ENROLLMENTS);
    await adminPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Table should be present
    const table = adminPage.locator(ENROLLMENTS.table);
    await expect(table).toBeVisible({ timeout: TIMEOUTS.LONG });

    // Should have at least the table header row
    const rows = adminPage.locator('table tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should have a search/filter input', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.ADMIN_ENROLLMENTS);
    await adminPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Search or filter input should exist
    const searchInput = adminPage.locator(ENROLLMENTS.searchInput).first();
    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.LONG });
  });

  test('should have status filter controls', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.ADMIN_ENROLLMENTS);
    await adminPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Status filter (select, combobox, or button group) should exist
    const filterControl = adminPage.locator(ENROLLMENTS.filterStatus).first();
    await expect(filterControl).toBeVisible({ timeout: TIMEOUTS.LONG });
  });
});

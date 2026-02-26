/**
 * Parent Flow E2E Tests — dashboard, grades, attendance.
 */
import { test, expect } from '../fixtures/auth.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { ROUTES, TIMEOUTS } from '../helpers/test-data.js';
import { PARENT } from '../helpers/selectors.js';

test.describe('Parent Flow', () => {
  test('should load the parent dashboard', async ({ parentPage }) => {
    const dashboard = new DashboardPage(parentPage);
    await dashboard.goto(ROUTES.PARENT_DASHBOARD);
    await dashboard.expectLoaded();

    // Dashboard heading should be visible
    const heading = await dashboard.getHeadingText();
    expect(heading).toBeTruthy();
  });

  test('should display child information on dashboard', async ({ parentPage }) => {
    const dashboard = new DashboardPage(parentPage);
    await dashboard.goto(ROUTES.PARENT_DASHBOARD);
    await dashboard.expectLoaded();

    // Stat cards or child info should be present
    const hasStats = await dashboard.expectStatCardsVisible();
    expect(hasStats).toBe(true);
  });

  test('should navigate to parent grades page', async ({ parentPage }) => {
    await parentPage.goto(ROUTES.PARENT_GRADES);
    await parentPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Grades page should load
    const heading = parentPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.LONG });
  });

  test('should navigate to parent attendance page', async ({ parentPage }) => {
    await parentPage.goto(ROUTES.PARENT_ATTENDANCE);
    await parentPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Attendance page should load
    const heading = parentPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.LONG });
  });

  test('should navigate to parent invoices page', async ({ parentPage }) => {
    await parentPage.goto(ROUTES.PARENT_INVOICES);
    await parentPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Invoices page should load
    const heading = parentPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.LONG });
  });
});

/**
 * Admin Dashboard E2E Tests — dashboard loads, sidebar nav, key admin pages.
 */
import { test, expect } from '../fixtures/auth.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { ROUTES } from '../helpers/test-data.js';

test.describe('Admin Dashboard', () => {
  test('should load the admin dashboard with stats', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(ROUTES.ADMIN_DASHBOARD);
    await dashboard.expectLoaded();

    // Dashboard heading should be visible
    const heading = await dashboard.getHeadingText();
    expect(heading).toBeTruthy();

    // Stat cards should be present
    const hasStats = await dashboard.expectStatCardsVisible();
    expect(hasStats).toBe(true);
  });

  test('should navigate to students page via sidebar', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(ROUTES.ADMIN_DASHBOARD);
    await dashboard.expectLoaded();

    // Click sidebar link "Học viên"
    await dashboard.navigateSidebar('Học viên');

    // Should navigate to the students page
    await expect(adminPage).toHaveURL(new RegExp(ROUTES.ADMIN_STUDENTS));
  });

  test('should navigate to classes page via sidebar', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto(ROUTES.ADMIN_DASHBOARD);
    await dashboard.expectLoaded();

    // Click sidebar link "Lớp học"
    await dashboard.navigateSidebar('Lớp học');

    await expect(adminPage).toHaveURL(new RegExp(ROUTES.ADMIN_CLASSES));
  });

  test('should access the settings page', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.ADMIN_SETTINGS);
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 });

    // Settings page should load
    const heading = adminPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should access the reports page', async ({ adminPage }) => {
    await adminPage.goto(ROUTES.ADMIN_REPORTS);
    await adminPage.waitForLoadState('networkidle', { timeout: 15000 });

    // Reports page should load
    const heading = adminPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

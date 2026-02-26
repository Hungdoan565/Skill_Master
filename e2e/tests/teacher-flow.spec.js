/**
 * Teacher Flow E2E Tests — dashboard, schedule, classes.
 */
import { test, expect } from '../fixtures/auth.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { ROUTES, TIMEOUTS } from '../helpers/test-data.js';
import { TEACHER } from '../helpers/selectors.js';

test.describe('Teacher Flow', () => {
  test('should load the teacher dashboard', async ({ teacherPage }) => {
    const dashboard = new DashboardPage(teacherPage);
    await dashboard.goto(ROUTES.TEACHER_DASHBOARD);
    await dashboard.expectLoaded();

    // Dashboard heading should be visible
    const heading = await dashboard.getHeadingText();
    expect(heading).toBeTruthy();
  });

  test('should display stat cards on teacher dashboard', async ({ teacherPage }) => {
    const dashboard = new DashboardPage(teacherPage);
    await dashboard.goto(ROUTES.TEACHER_DASHBOARD);
    await dashboard.expectLoaded();

    const hasStats = await dashboard.expectStatCardsVisible();
    expect(hasStats).toBe(true);
  });

  test('should navigate to teacher schedule page', async ({ teacherPage }) => {
    await teacherPage.goto(ROUTES.TEACHER_SCHEDULE);
    await teacherPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Schedule page should load — look for calendar/schedule or heading
    const heading = teacherPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.LONG });

    // Schedule component should be present
    const schedule = teacherPage.locator(TEACHER.scheduleTable).first();
    await expect(schedule).toBeVisible({ timeout: TIMEOUTS.LONG });
  });

  test('should navigate to teacher classes page', async ({ teacherPage }) => {
    await teacherPage.goto(ROUTES.TEACHER_CLASSES);
    await teacherPage.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Classes page should load
    const heading = teacherPage.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.LONG });
  });

  test('should navigate between teacher pages via sidebar', async ({ teacherPage }) => {
    const dashboard = new DashboardPage(teacherPage);
    await dashboard.goto(ROUTES.TEACHER_DASHBOARD);
    await dashboard.expectLoaded();

    // Navigate to schedule via sidebar — Vietnamese label "Lịch dạy"
    await dashboard.navigateSidebar('Lịch dạy');
    await expect(teacherPage).toHaveURL(new RegExp(ROUTES.TEACHER_SCHEDULE));
  });
});

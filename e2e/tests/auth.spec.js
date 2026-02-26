/**
 * Auth E2E Tests — login success, login failure, logout, redirect.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { TEST_USERS, ROUTES } from '../helpers/test-data.js';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display the login page with all elements', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.expectLoaded();

      // Verify Vietnamese heading
      await expect(loginPage.heading).toHaveText('Đăng nhập');

      // Verify social login buttons are visible
      await expect(page.locator('button:has-text("Google")')).toBeVisible();
      await expect(page.locator('button:has-text("GitHub")')).toBeVisible();

      // Verify "Đăng ký ngay" link is visible
      await expect(loginPage.registerLink).toBeVisible();
    });

    test('should login successfully with valid admin credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
      await loginPage.expectRedirectTo(TEST_USERS.ADMIN.dashboardPath);

      // Should be on the admin dashboard
      await expect(page).toHaveURL(new RegExp(TEST_USERS.ADMIN.dashboardPath));
    });

    test('should show error message with invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('invalid@example.com', 'WrongPassword123');

      // Error message should appear (Vietnamese)
      await loginPage.expectError('');
      await expect(loginPage.errorMessage).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Click submit without filling fields
      await loginPage.submitButton.click();

      // Validation errors should appear
      const errorMessages = page.locator('text=Vui lòng nhập');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login page', async ({ page }) => {
      // First login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password);
      await loginPage.expectRedirectTo(TEST_USERS.ADMIN.dashboardPath);

      // Then logout via dashboard
      const dashboard = new DashboardPage(page);
      await dashboard.logout();

      // Should redirect to login or home
      await page.waitForURL(/\/(login)?$/, { timeout: 15000 });
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users from admin pages to login', async ({ page }) => {
      // Try to access admin dashboard without auth
      await page.goto(ROUTES.ADMIN_DASHBOARD);

      // Should be redirected to login
      await page.waitForURL(/\/login/, { timeout: 15000 });
    });

    test('should redirect unauthenticated users from teacher pages to login', async ({ page }) => {
      await page.goto(ROUTES.TEACHER_DASHBOARD);
      await page.waitForURL(/\/login/, { timeout: 15000 });
    });

    test('should redirect unauthenticated users from student pages to login', async ({ page }) => {
      await page.goto(ROUTES.STUDENT_DASHBOARD);
      await page.waitForURL(/\/login/, { timeout: 15000 });
    });
  });
});

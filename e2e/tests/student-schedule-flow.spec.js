import { test, expect } from '@playwright/test';
import { ROUTES, TEST_USERS, TIMEOUTS } from '../helpers/test-data.js';

async function ensureStudentLogin(page, request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY for E2E auth injection.');
  }

  const credentialCandidates = [
    { email: 'hungdoan1304@gmail.com', password: 'Student@123456' },
    TEST_USERS.STUDENT,
  ];

  let session = null;

  for (const creds of credentialCandidates) {
    const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      data: { email: creds.email, password: creds.password },
    });

    if (response.ok()) {
      session = await response.json();
      break;
    }
  }

  if (!session?.access_token) {
    throw new Error('Unable to acquire student session from Supabase token endpoint.');
  }

  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  const storageValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    token_type: session.token_type || 'bearer',
    user: session.user,
  });

  await page.goto('/');
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [storageKey, storageValue]
  );

  await page.goto(ROUTES.STUDENT_SCHEDULE);
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

  if (!page.url().includes('/student/schedule')) {
    throw new Error(`Student session injection failed, current URL: ${page.url()}`);
  }
}

test.describe('Student Schedule Flow', () => {
  test('switches week/month, keeps controls active, and supports filters', async ({ page, request }) => {
    await ensureStudentLogin(page, request);

    await expect(page.getByRole('heading', { name: /Lịch học của tôi/i })).toBeVisible({ timeout: TIMEOUTS.LONG });

    const rangeTitle = page.locator('h2.text-lg.font-semibold').first();
    const before = (await rangeTitle.textContent())?.trim() || '';

    await page.getByRole('button', { name: 'Tháng' }).click();
    await expect(page.getByRole('button', { name: 'Tháng' })).toHaveAttribute('aria-pressed', 'true');
    const monthRange = (await rangeTitle.textContent())?.trim() || '';
    expect(monthRange).not.toBe(before);

    await page.getByRole('button', { name: 'Tuần' }).click();
    await expect(page.getByRole('button', { name: 'Tuần' })).toHaveAttribute('aria-pressed', 'true');
    await expect(rangeTitle).toContainText(/\d{2}[/-]\d{2}\s-\s\d{2}[/-]\d{2}[/-]\d{4}/);

    await page.getByRole('combobox', { name: 'Phạm vi lớp' }).click();
    await page.getByRole('option', { name: 'Đã và đang học' }).click();

    await page.getByRole('combobox', { name: 'Lọc theo lớp học' }).click();
    await page.getByRole('option', { name: 'Tất cả lớp' }).click();

    const refreshButton = page.getByRole('button', { name: 'Làm mới dữ liệu lịch học' });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    await expect(page.locator('text=Phạm vi:')).toBeVisible();
  });

  test('shows denied notification fallback message', async ({ page, context, request }) => {
    await context.addInitScript(() => {
      const MockNotification = function () {};
      // @ts-ignore
      MockNotification.permission = 'denied';
      // @ts-ignore
      MockNotification.requestPermission = () => Promise.resolve('denied');
      // @ts-ignore
      window.Notification = MockNotification;
    });

    await ensureStudentLogin(page, request);

    const notifyButton = page.getByRole('button', { name: /Bật nhắc lịch học|Tắt nhắc lịch học/i });
    await expect(notifyButton).toBeVisible({ timeout: TIMEOUTS.LONG });
    await page.evaluate(() => {
      localStorage.setItem('schedule_notifications_enabled', 'false');
    });
    await notifyButton.click();

    await expect(page.getByRole('button', { name: 'Bật nhắc lịch học' })).toBeVisible({ timeout: TIMEOUTS.LONG });
    await expect(page.locator('text=Không thể tải lịch học')).toBeVisible({ timeout: TIMEOUTS.LONG });
  });
});

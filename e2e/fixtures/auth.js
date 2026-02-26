/**
 * Role-based auth fixtures for Skill Master E2E tests.
 *
 * Provides pre-authenticated `page` objects for each role so tests
 * skip the UI login flow and start already signed-in.
 *
 * Auth strategy: call Supabase Auth REST API to get an access_token,
 * then inject it into the browser's localStorage so the Supabase JS
 * client picks it up automatically.
 */
import { test as base, expect } from '@playwright/test';
import { TEST_USERS, API } from '../helpers/test-data.js';

// Supabase project URL — must match the frontend's supabaseClient config
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

/**
 * Authenticate via Supabase REST API and return session tokens.
 */
async function authenticateUser(request, email, password) {
  const loginUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

  const response = await request.post(loginUrl, {
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Auth failed for ${email}: ${response.status()} — ${body}`
    );
  }

  return response.json();
}

/**
 * Inject Supabase session into browser localStorage so the app
 * considers the user authenticated on first load.
 */
async function injectSession(page, session) {
  const supabaseStorageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

  const storageValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    token_type: session.token_type || 'bearer',
    user: session.user,
  });

  // Navigate to the app origin first so we can write to its localStorage
  await page.goto('/');
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [supabaseStorageKey, storageValue]
  );
}

/**
 * Create a fixture factory for a given role.
 * Returns a `page` that is already authenticated.
 */
function createAuthFixture(userConfig) {
  return async ({ page, request }, use) => {
    try {
      const session = await authenticateUser(
        request,
        userConfig.email,
        userConfig.password
      );
      await injectSession(page, session);
      // Reload so the app picks up the injected session
      await page.reload();
      // Wait for auth context to initialise
      await page.waitForTimeout(500);
    } catch (error) {
      // Auth may fail if test users don't exist yet — log and continue
      // Tests can still use the page (will see login screen)
      console.warn(
        `[auth-fixture] Could not authenticate ${userConfig.role}: ${error.message}`
      );
    }
    await use(page);
  };
}

// ============================================
// EXTENDED TEST WITH ROLE FIXTURES
// ============================================
export const test = base.extend({
  /** Pre-authenticated admin page (SUPER_ADMIN) */
  adminPage: createAuthFixture(TEST_USERS.ADMIN),

  /** Pre-authenticated teacher page */
  teacherPage: createAuthFixture(TEST_USERS.TEACHER),

  /** Pre-authenticated student page */
  studentPage: createAuthFixture(TEST_USERS.STUDENT),

  /** Pre-authenticated parent page */
  parentPage: createAuthFixture(TEST_USERS.PARENT),
});

export { expect };

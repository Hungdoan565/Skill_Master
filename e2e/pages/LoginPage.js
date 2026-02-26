/**
 * LoginPage — Page Object Model for the auth/login page.
 */
import { AUTH } from '../helpers/selectors.js';
import { ROUTES, TIMEOUTS } from '../helpers/test-data.js';

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator(AUTH.emailInput);
    this.passwordInput = page.locator(AUTH.passwordInput);
    this.submitButton = page.locator(AUTH.submitButton);
    this.errorMessage = page.locator(AUTH.errorMessage);
    this.heading = page.locator(AUTH.heading);
    this.registerLink = page.locator(AUTH.registerLink);
    this.forgotPasswordLink = page.locator(AUTH.forgotPasswordLink);
  }

  /** Navigate to login page */
  async goto() {
    await this.page.goto(ROUTES.LOGIN);
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.NAVIGATION });
  }

  /** Fill email and password, then submit */
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Verify we landed on the expected dashboard after login */
  async expectRedirectTo(path) {
    await this.page.waitForURL(`**${path}*`, { timeout: TIMEOUTS.NAVIGATION });
  }

  /** Verify an error message is displayed */
  async expectError(text) {
    await this.errorMessage.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    if (text) {
      const content = await this.errorMessage.textContent();
      return content?.includes(text);
    }
    return true;
  }

  /** Check that the login page is fully loaded */
  async expectLoaded() {
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.NAVIGATION });
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.submitButton.waitFor({ state: 'visible' });
  }
}

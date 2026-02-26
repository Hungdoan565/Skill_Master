/**
 * DashboardPage — Page Object Model for role-based dashboards.
 * Works for admin, teacher, student, and parent dashboards.
 */
import { DASHBOARD, LAYOUT } from '../helpers/selectors.js';
import { TIMEOUTS } from '../helpers/test-data.js';

export class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.locator(DASHBOARD.welcomeHeading).first();
    this.statCards = page.locator(DASHBOARD.statCard);
    this.sidebar = page.locator(LAYOUT.sidebar).first();
    this.userMenu = page.locator(LAYOUT.headerUserMenu).first();
    this.logoutButton = page.locator(LAYOUT.logoutButton);
  }

  /** Navigate to a specific dashboard */
  async goto(path) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
  }

  /** Verify the dashboard page loaded with content */
  async expectLoaded() {
    // Wait for at least one heading or stat card to appear
    await this.page.waitForLoadState('domcontentloaded');
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.LONG });
  }

  /** Check that stat cards are visible on the dashboard */
  async expectStatCardsVisible() {
    const count = await this.statCards.count();
    return count > 0;
  }

  /** Click a sidebar navigation link by Vietnamese text */
  async navigateSidebar(linkText) {
    const link = this.page.locator(LAYOUT.sidebarLink(linkText));
    await link.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
  }

  /** Open user dropdown menu */
  async openUserMenu() {
    await this.userMenu.click();
    await this.logoutButton.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
  }

  /** Logout via user menu */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  /** Get the current page heading text */
  async getHeadingText() {
    return this.heading.textContent();
  }
}

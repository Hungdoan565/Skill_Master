/**
 * StudentsPage — Page Object Model for the admin students list page.
 */
import { STUDENTS } from '../helpers/selectors.js';
import { ROUTES, TIMEOUTS } from '../helpers/test-data.js';

export class StudentsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.table = page.locator(STUDENTS.table);
    this.rows = page.locator(STUDENTS.tableRow);
    this.searchInput = page.locator(STUDENTS.searchInput).first();
    this.addButton = page.locator(STUDENTS.addButton).first();
    this.pagination = page.locator(STUDENTS.pagination);
  }

  /** Navigate to the students list page */
  async goto() {
    await this.page.goto(ROUTES.ADMIN_STUDENTS);
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
  }

  /** Verify the students table is loaded */
  async expectTableLoaded() {
    await this.table.waitFor({ state: 'visible', timeout: TIMEOUTS.LONG });
  }

  /** Search for a student by name */
  async search(query) {
    await this.searchInput.fill(query);
    // Wait for debounced search to trigger
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.MEDIUM });
  }

  /** Get the count of visible table rows */
  async getRowCount() {
    return this.rows.count();
  }

  /** Click on a student row by index (0-based) */
  async clickStudent(index = 0) {
    const row = this.rows.nth(index);
    await row.click();
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
  }

  /** Get text content of the first student name cell */
  async getFirstStudentName() {
    const nameCell = this.page.locator(STUDENTS.studentName).first();
    return nameCell.textContent();
  }
}

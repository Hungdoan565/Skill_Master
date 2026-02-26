/**
 * Shared selectors/locators for Skill Master E2E tests.
 * Centralised here so changes to UI only require updates in one place.
 *
 * Convention: Vietnamese text selectors match the actual UI labels.
 */

// ============================================
// AUTH / LOGIN PAGE
// ============================================
export const AUTH = {
  emailInput: '#login-email',
  passwordInput: '#login-password',
  submitButton: 'button[type="submit"]:has-text("Đăng nhập")',
  errorMessage: '.bg-red-50 p',
  forgotPasswordLink: 'button:has-text("Quên mật khẩu?")',
  registerLink: 'button:has-text("Đăng ký ngay")',
  googleButton: 'button:has-text("Google")',
  githubButton: 'button:has-text("GitHub")',
  heading: 'h1:has-text("Đăng nhập")',
};

// ============================================
// COMMON LAYOUT
// ============================================
export const LAYOUT = {
  sidebar: 'aside, nav[data-sidebar], [class*="sidebar"]',
  sidebarLink: (text) => `a:has-text("${text}")`,
  headerUserMenu: 'button:has(img), button:has([class*="rounded-full"])',
  logoutButton: 'button:has-text("Đăng xuất")',
  pageLoader: 'text=Đang tải...',
  breadcrumb: '[class*="breadcrumb"]',
};

// ============================================
// DASHBOARD
// ============================================
export const DASHBOARD = {
  statCard: '[class*="stat"], [class*="card"], [class*="rounded"]',
  welcomeHeading: 'h1, h2',
  quickActions: '[class*="quick-action"], [class*="action"]',
};

// ============================================
// STUDENTS PAGE
// ============================================
export const STUDENTS = {
  table: 'table',
  tableRow: 'table tbody tr',
  searchInput: 'input[placeholder*="Tìm"], input[placeholder*="tìm"], input[type="search"]',
  addButton: 'button:has-text("Thêm"), a:has-text("Thêm")',
  studentName: 'table tbody tr td:first-child',
  pagination: '[class*="pagination"], nav[aria-label="pagination"]',
};

// ============================================
// ENROLLMENTS PAGE
// ============================================
export const ENROLLMENTS = {
  table: 'table',
  tableRow: 'table tbody tr',
  filterStatus: 'select, button:has-text("Trạng thái"), [role="combobox"]',
  searchInput: 'input[placeholder*="Tìm"], input[type="search"]',
  newEnrollmentButton: 'a:has-text("Đăng ký mới"), button:has-text("Đăng ký")',
};

// ============================================
// TEACHER PAGES
// ============================================
export const TEACHER = {
  scheduleTable: 'table, [class*="schedule"], [class*="calendar"]',
  classCard: '[class*="card"], [class*="class"]',
  className: 'h3, [class*="title"]',
};

// ============================================
// PARENT PAGES
// ============================================
export const PARENT = {
  childSelector: 'select, [role="combobox"]',
  gradeTable: 'table',
  attendanceTable: 'table, [class*="attendance"]',
  invoiceTable: 'table',
};

// ============================================
// COMMON ELEMENTS
// ============================================
export const COMMON = {
  toast: '[data-sonner-toast], [class*="toast"]',
  modal: '[role="dialog"], [class*="modal"]',
  modalClose: '[role="dialog"] button:has-text("Đóng"), [role="dialog"] button[aria-label="Close"]',
  loadingSpinner: '[class*="animate-spin"], [class*="spinner"]',
  emptyState: 'text=Không có dữ liệu, text=Chưa có',
  confirmButton: 'button:has-text("Xác nhận"), button:has-text("Đồng ý")',
  cancelButton: 'button:has-text("Hủy"), button:has-text("Đóng")',
};

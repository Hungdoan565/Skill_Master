/**
 * Barrel Export - Invoices Feature
 * 
 * Entry point cho toàn bộ module Invoices.
 * Cho phép import như sau:
 * 
 * import { InvoicesPage } from '@/features/invoices';
 * import { useInvoices, StatusBadge } from '@/features/invoices';
 */

// Main Pages
export { InvoicesPage } from './pages/InvoicesPage';
export { OverdueDashboardPage } from './pages/OverdueDashboardPage';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

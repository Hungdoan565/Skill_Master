/**
 * Barrel Export - Invoices Feature
 * 
 * Entry point cho toàn bộ module Invoices.
 * Cho phép import như sau:
 * 
 * import { InvoicesPage } from '@/features/invoices';
 * import { useInvoices, StatusBadge } from '@/features/invoices';
 */

// Main Page
export { InvoicesPage } from './pages/InvoicesPage';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

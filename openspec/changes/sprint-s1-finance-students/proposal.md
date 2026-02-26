# Sprint S1: Finance + Students Polish

## Goal
Bring Finance module from 82% to 95% and Students module from 88% to 95%.

## Changes

### F1: Payment Audit Trail (HIGH)
- Backend: auto-set `confirmed_by` from `req.user.id` when admin records/verifies payment
- Backend: add `confirmation_method` field (cash/bank_transfer/import/manual)
- Frontend: display audit info in InvoiceDetailModal payment history

### F2: Invoice Print Template (MEDIUM)
- Create printable invoice template (separate from receipt)
- Include: student info, class details, fee breakdown, payment status, due date
- Print button in InvoiceDetailModal

### F3: Financial Summary Dashboard (MEDIUM)
- Revenue overview cards (monthly/quarterly)
- Payment method breakdown chart
- Overdue trend chart
- Center comparison (SUPER_ADMIN only)
- Reuse existing OverdueDashboardPage as base

### S1: Student Import Modal (HIGH)
- CSV/Excel upload with column mapping
- Validation preview before import
- Error report for failed rows
- Follow existing ImportModal pattern from classes-list

### S2: Student Detail Documents Tab (MEDIUM)
- New tab in StudentDetailPage
- Upload/view/delete documents per student
- Use Supabase Storage for file storage
- Document types: ID, certificate, medical, other

## Impact
- Backend: index.js (payment endpoints), new import service
- Frontend: invoices/, students/ features
- Database: may need migration for document metadata

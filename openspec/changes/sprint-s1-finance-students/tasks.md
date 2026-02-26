## 1. Payment Audit Trail (F1)

- [x] 1.1 Backend: auto-set `confirmed_by = req.user.id` in payment record/verify/bulk-verify endpoints
- [x] 1.2 Backend: add `confirmation_method` to payment insert (cash/bank_transfer/import/manual)
- [x] 1.3 Frontend: display confirmed_by user name and confirmation_method in InvoiceDetailModal payment history

## 2. Invoice Print Template (F2)

- [x] 2.1 Create InvoicePrintTemplate component (student info, class, fee breakdown, payment status)
- [x] 2.2 Add print button to InvoiceDetailModal that opens print preview
- [x] 2.3 Style for A4 print with Vietnamese formatting

## 3. Financial Summary Dashboard (F3)

- [x] 3.1 Backend: add /api/finance/summary endpoint (revenue, payment methods, trends)
- [x] 3.2 Create FinancialDashboard page with revenue cards, charts
- [x] 3.3 Add center comparison view for SUPER_ADMIN
- [x] 3.4 Add route and sidebar navigation entry

## 4. Student Import (S1)

- [x] 4.1 Create StudentImportModal with file upload + column mapping
- [x] 4.2 Backend: add /api/students/import endpoint with validation
- [x] 4.3 Add import button to StudentsPage header
- [x] 4.4 Show validation preview and error report

## 5. Student Documents Tab (S2)

- [x] 5.1 Create DocumentsTab component for StudentDetailPage
- [x] 5.2 Backend: CRUD endpoints for student documents (upload/list/delete via Supabase Storage)
- [x] 5.3 Add Documents tab to StudentDetailPage tabs array

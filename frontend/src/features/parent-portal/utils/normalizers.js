export function normalizeParentChild(rawChild = {}) {
    const stats = rawChild.stats || {};

    return {
        ...rawChild,
        id: rawChild.id ?? rawChild.studentId ?? rawChild.student_id ?? rawChild.user_id ?? null,
        link_id: rawChild.link_id ?? rawChild.linkId ?? null,
        full_name: rawChild.full_name ?? rawChild.studentName ?? rawChild.student_name ?? 'Học viên chưa cập nhật',
        email: rawChild.email ?? rawChild.studentEmail ?? rawChild.student_email ?? null,
        phone: rawChild.phone ?? rawChild.studentPhone ?? rawChild.student_phone ?? null,
        avatar_url: rawChild.avatar_url ?? rawChild.avatarUrl ?? null,
        date_of_birth: rawChild.date_of_birth ?? rawChild.dateOfBirth ?? rawChild.student_dob ?? null,
        relationship: rawChild.relationship ?? null,
        is_primary: rawChild.is_primary ?? rawChild.isPrimary ?? false,
        can_pay: rawChild.can_pay ?? rawChild.canPay ?? false,
        can_view_academics: rawChild.can_view_academics ?? rawChild.canViewAcademics ?? false,
        center_name: rawChild.center_name ?? rawChild.centerName ?? rawChild.center?.name ?? null,
        active_classes_count: rawChild.active_classes_count ?? rawChild.activeClassesCount ?? stats.activeClasses ?? 0,
        unpaid_invoices_count: rawChild.unpaid_invoices_count ?? rawChild.unpaidInvoicesCount ?? stats.unpaidInvoices ?? 0,
        unpaid_amount: rawChild.unpaid_amount ?? rawChild.unpaidAmount ?? stats.unpaidAmount ?? 0,
    };
}

export function normalizeParentChildren(children) {
    if (!Array.isArray(children)) {
        return [];
    }

    return children
        .map(normalizeParentChild)
        .filter((child) => child.id);
}

export function normalizeParentInvoice(rawInvoice = {}) {
    return {
        ...rawInvoice,
        invoice_number: rawInvoice.invoice_number ?? rawInvoice.invoiceNumber ?? rawInvoice.invoice_code ?? rawInvoice.invoiceCode ?? 'Hóa đơn',
        issue_date: rawInvoice.issue_date ?? rawInvoice.issueDate ?? rawInvoice.created_at ?? null,
        due_date: rawInvoice.due_date ?? rawInvoice.dueDate ?? null,
        final_amount: rawInvoice.final_amount ?? rawInvoice.finalAmount ?? rawInvoice.amount ?? rawInvoice.total_amount ?? 0,
        total_amount: rawInvoice.total_amount ?? rawInvoice.amount ?? rawInvoice.final_amount ?? rawInvoice.finalAmount ?? 0,
        paid_amount: rawInvoice.paid_amount ?? rawInvoice.paidAmount ?? 0,
        discount_amount: rawInvoice.discount_amount ?? rawInvoice.discountAmount ?? 0,
        description: rawInvoice.description ?? rawInvoice.notes ?? null,
        className: rawInvoice.className ?? rawInvoice.class?.name ?? null,
        classCode: rawInvoice.classCode ?? rawInvoice.class?.code ?? null,
        courseTitle: rawInvoice.courseTitle ?? rawInvoice.class?.course?.title ?? null,
        centerName: rawInvoice.centerName ?? rawInvoice.center?.name ?? null,
        payments: Array.isArray(rawInvoice.payments) ? rawInvoice.payments : [],
    };
}

export function normalizeParentInvoices(invoices) {
    if (!Array.isArray(invoices)) {
        return [];
    }

    return invoices.map(normalizeParentInvoice);
}

/**
 * Determine urgency level of an invoice for display & sorting.
 * @param {Object} invoice - Normalized invoice object
 * @returns {'overdue'|'due-soon'|'unpaid'|'pending'|'paid'|'cancelled'}
 */
export function getInvoiceUrgency(invoice) {
    if (!invoice) return 'paid';

    const status = invoice.status;
    if (status === 'paid') return 'paid';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'overdue') return 'overdue';

    // Check if due_date is within 3 days
    if (invoice.due_date) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(invoice.due_date);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 3) return 'due-soon';
    }

    if (status === 'pending') return 'pending';
    if (status === 'partial' || status === 'unpaid') return 'unpaid';

    return 'paid';
}

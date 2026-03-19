import { getInvoiceUrgency } from './normalizers.js';

const formatCurrency = (amount) => {
    const safeAmount = Number(amount) || 0;

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(safeAmount);
};

const getDayLabel = (dayOfWeek) => {
    if (dayOfWeek === 8 || dayOfWeek === 0) return 'Chủ nhật';
    if (!dayOfWeek) return 'Chưa xác định';

    return `Thứ ${dayOfWeek}`;
};

const getTimeLabel = (startTime, endTime) => `${startTime?.slice(0, 5) || '--:--'} - ${endTime?.slice(0, 5) || '--:--'}`;

const getRelationshipLabel = (relationship) => {
    if (relationship === 'father') return 'Cha';
    if (relationship === 'mother') return 'Mẹ';
    if (relationship === 'guardian') return 'Người giám hộ';
    return 'Phụ huynh liên kết';
};

export function buildParentDashboardInsights({ children = [] } = {}) {
    const safeChildren = Array.isArray(children) ? children : [];

    const summary = {
        linkedStudents: safeChildren.length,
        studentsWithClasses: safeChildren.filter((child) => (child.active_classes_count || 0) > 0).length,
        totalOutstanding: safeChildren.reduce((sum, child) => sum + (Number(child.unpaid_amount) || 0), 0),
        totalOutstandingInvoices: safeChildren.reduce((sum, child) => sum + (Number(child.unpaid_invoices_count) || 0), 0),
    };

    const actions = safeChildren
        .flatMap((child) => {
            const items = [];

            if ((child.unpaid_invoices_count || 0) > 0) {
                items.push({
                    id: `${child.id}-invoice`,
                    studentId: child.id,
                    severity: child.unpaid_amount > 0 ? 'high' : 'medium',
                    title: `Cần theo dõi thanh toán cho ${child.full_name}`,
                    description:
                        child.unpaid_amount > 0
                            ? `${child.unpaid_invoices_count} hóa đơn chưa hoàn tất với tổng số tiền ${formatCurrency(child.unpaid_amount)}.`
                            : `${child.unpaid_invoices_count} hóa đơn đang chờ xác nhận thanh toán.`,
                    href: '/parent/invoices',
                });
            }

            if ((child.active_classes_count || 0) === 0) {
                items.push({
                    id: `${child.id}-class`,
                    studentId: child.id,
                    severity: 'low',
                    title: `${child.full_name} hiện chưa có lớp đang theo học`,
                    description: 'Nên xác nhận lại trạng thái ghi danh với trung tâm để tránh thiếu thông tin học tập.',
                    href: `/parent/child/${child.id}`,
                });
            }

            return items;
        })
        .sort((a, b) => {
            const severityRank = { high: 0, medium: 1, low: 2 };
            return (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99);
        });

    const studentSnapshots = safeChildren.map((child) => ({
        id: child.id,
        title: child.full_name,
        subtitle: child.center_name || 'Chưa có trung tâm',
        chips: [
            `${child.active_classes_count || 0} lớp đang theo học`,
            `${getRelationshipLabel(child.relationship)}`,
            child.unpaid_invoices_count > 0
                ? `${child.unpaid_invoices_count} hóa đơn cần theo dõi`
                : 'Không có hóa đơn cần theo dõi',
        ],
        outstandingLabel:
            child.unpaid_amount > 0
                ? `Còn ${formatCurrency(child.unpaid_amount)}`
                : 'Không có học phí tồn',
        href: `/parent/child/${child.id}`,
    }));

    return {
        summary,
        actions,
        studentSnapshots,
    };
}

export function buildParentChildOverview({ child, attendance = [], grades = [], schedule = [], invoices = [] } = {}) {
    const safeChild = child || {};
    const safeAttendance = Array.isArray(attendance) ? attendance : [];
    const safeGrades = Array.isArray(grades) ? grades : [];
    const safeSchedule = Array.isArray(schedule) ? schedule : [];
    const safeInvoices = Array.isArray(invoices) ? invoices : [];

    const attended = safeAttendance.filter((item) => item.status === 'present' || item.status === 'late').length;
    const attendanceRate = safeAttendance.length > 0 ? Math.round((attended / safeAttendance.length) * 100) : 0;
    const latestGrade = safeGrades[0] || null;
    const nextSession = safeSchedule[0] || null;
    const outstandingInvoices = safeInvoices.filter((invoice) => ['unpaid', 'partial', 'pending', 'overdue'].includes(invoice.status));
    const outstandingAmount = outstandingInvoices.reduce(
        (sum, invoice) => sum + Math.max((invoice.final_amount || invoice.total_amount || 0) - (invoice.paid_amount || 0), 0),
        0,
    );

    return {
        heroMetrics: [
            {
                label: 'Lớp đang theo học',
                value: String(safeChild.active_classes_count || 0),
                hint: safeChild.center_name || 'Đang đồng bộ trung tâm',
            },
            {
                label: 'Chuyên cần',
                value: `${attendanceRate}%`,
                hint: safeAttendance.length > 0 ? `${safeAttendance.length} buổi đã ghi nhận` : 'Chưa có dữ liệu điểm danh',
            },
            {
                label: 'Điểm gần nhất',
                value: latestGrade?.score != null ? Number(latestGrade.score).toFixed(1) : '--',
                hint: latestGrade?.className || latestGrade?.courseTitle || 'Chưa có điểm số mới',
            },
            {
                label: 'Cần thanh toán',
                value: formatCurrency(outstandingAmount),
                hint: outstandingInvoices.length > 0 ? `${outstandingInvoices.length} hóa đơn đang mở` : 'Không có học phí tồn',
            },
        ],
        nextSession: nextSession
            ? {
                title: nextSession.className || nextSession.courseTitle || 'Buổi học sắp tới',
                description: `${getDayLabel(nextSession.dayOfWeek)} • ${getTimeLabel(nextSession.startTime, nextSession.endTime)}`,
            }
            : {
                title: 'Chưa có buổi học sắp tới',
                description: 'Lịch học sẽ xuất hiện tại đây khi trung tâm cập nhật lớp.',
            },
        academicStatus: latestGrade
            ? {
                title: `Kết quả gần nhất: ${Number(latestGrade.score).toFixed(1)}`,
                description: latestGrade.className || latestGrade.courseTitle || 'Đã có điểm số mới được cập nhật.',
            }
            : {
                title: 'Chưa có điểm số mới',
                description: 'Khi giáo viên cập nhật điểm, kết quả sẽ xuất hiện tại đây.',
            },
        attendanceStatus:
            safeAttendance.length > 0
                ? {
                    title: `Chuyên cần ${attendanceRate}%`,
                    description: `${safeAttendance.filter((item) => item.status === 'absent').length} buổi vắng, ${safeAttendance.filter((item) => item.status === 'late').length} buổi đi muộn.`,
                }
                : {
                    title: 'Chưa có dữ liệu điểm danh',
                    description: 'Trung tâm chưa ghi nhận dữ liệu điểm danh cho học viên này.',
                },
        financialStatus:
            outstandingInvoices.length > 0
                ? {
                    title: `Còn ${formatCurrency(outstandingAmount)} cần theo dõi`,
                    description: `${outstandingInvoices.length} hóa đơn đang cần thanh toán hoặc xác nhận.`,
                }
                : {
                    title: 'Không có khoản cần thanh toán',
                    description: 'Tất cả hóa đơn hiện tại đang ở trạng thái an toàn.',
                },
    };
}

export function buildParentScheduleGroups(schedule = []) {
    const safeSchedule = Array.isArray(schedule) ? schedule : [];
    const grouped = new Map();

    for (const item of safeSchedule) {
        const groupKey = item.classId || `${item.className || 'unknown'}-${item.courseTitle || 'unknown'}`;

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
                classId: item.classId || groupKey,
                className: item.className || 'Lớp chưa đặt tên',
                classCode: item.classCode || null,
                courseTitle: item.courseTitle || 'Chưa có khóa học',
                teacherName: item.teacherName || null,
                primaryRoomName: item.roomName || 'Chưa xếp phòng',
                slots: [],
            });
        }

        const slotKey = `${item.dayOfWeek || 'x'}-${item.startTime || 'x'}-${item.endTime || 'x'}-${item.roomName || 'x'}`;
        const targetGroup = grouped.get(groupKey);

        const alreadyExists = targetGroup.slots.some((slot) => slot.slotKey === slotKey);
        if (alreadyExists) {
            continue;
        }

        targetGroup.slots.push({
            id: item.sessionId || slotKey,
            slotKey,
            dayOfWeek: item.dayOfWeek || null,
            dayLabel: getDayLabel(item.dayOfWeek),
            startTime: item.startTime || null,
            endTime: item.endTime || null,
            timeLabel: getTimeLabel(item.startTime, item.endTime),
            roomName: item.roomName || 'Chưa xếp phòng',
        });
    }

    return Array.from(grouped.values()).map((group) => {
        const slots = [...group.slots].sort((a, b) => {
            const dayDiff = (a.dayOfWeek || 99) - (b.dayOfWeek || 99);
            if (dayDiff !== 0) return dayDiff;

            return (a.startTime || '').localeCompare(b.startTime || '');
        });

        return {
            ...group,
            slots,
            slotCount: slots.length,
            slotCountLabel: `${slots.length} buổi/tuần`,
        };
    });
}

export function buildParentGradesGroups(grades = []) {
    const safeGrades = Array.isArray(grades) ? grades : [];
    const grouped = new Map();

    for (const item of safeGrades) {
        const groupKey = item.classCode || item.className || item.courseTitle || 'unknown';

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
                classKey: groupKey,
                className: item.className || 'Lớp chưa xác định',
                classCode: item.classCode || null,
                courseTitle: item.courseTitle || 'Chưa có khóa học',
                assessments: [],
            });
        }

        grouped.get(groupKey).assessments.push({
            id: item.id || `${groupKey}-${item.gradeType || 'grade'}-${item.assessmentDate || 'date'}`,
            gradeType: item.gradeType || 'Đầu điểm',
            assessmentDate: item.assessmentDate || null,
            score: item.score ?? null,
            weight: item.weight ?? null,
        });
    }

    return Array.from(grouped.values()).map((group) => {
        const assessments = [...group.assessments].sort((a, b) => {
            const dateA = a.assessmentDate ? new Date(a.assessmentDate).getTime() : 0;
            const dateB = b.assessmentDate ? new Date(b.assessmentDate).getTime() : 0;
            return dateB - dateA;
        });

        const scoredAssessments = assessments.filter((assessment) => assessment.score != null);
        const weightedAssessments = scoredAssessments.filter((assessment) => typeof assessment.weight === 'number' && assessment.weight > 0);

        let summaryScore = null;
        if (weightedAssessments.length > 0) {
            const totalWeight = weightedAssessments.reduce((sum, assessment) => sum + assessment.weight, 0);
            if (totalWeight > 0) {
                summaryScore = weightedAssessments.reduce(
                    (sum, assessment) => sum + (assessment.score * assessment.weight),
                    0,
                ) / totalWeight;
            }
        } else if (scoredAssessments.length > 0) {
            summaryScore = scoredAssessments.reduce((sum, assessment) => sum + assessment.score, 0) / scoredAssessments.length;
        }

        return {
            ...group,
            assessments,
            latestScore: assessments[0]?.score ?? null,
            summaryScore: summaryScore == null ? null : Number(summaryScore.toFixed(1)),
            summaryLabel: 'Điểm trung bình',
            assessmentCount: assessments.length,
            assessmentCountLabel: `${assessments.length} đầu điểm`,
        };
    });
}

/**
 * Group invoices into 3 buckets for the parent invoices page.
 * - actionRequired: overdue + unpaid + partial (needs payment action)
 * - pendingVerification: pending (payment sent, awaiting center confirmation)
 * - completed: paid + cancelled
 */
export function buildInvoiceGroups(invoices = []) {
    const safe = Array.isArray(invoices) ? invoices : [];

    const actionRequired = [];
    const pendingVerification = [];
    const completed = [];

    for (const inv of safe) {
        const urgency = getInvoiceUrgency(inv);
        if (urgency === 'overdue' || urgency === 'due-soon' || urgency === 'unpaid') {
            actionRequired.push(inv);
        } else if (urgency === 'pending') {
            pendingVerification.push(inv);
        } else {
            completed.push(inv);
        }
    }

    // Sort actionRequired: overdue first, then by due_date ascending
    actionRequired.sort((a, b) => {
        const urgA = getInvoiceUrgency(a);
        const urgB = getInvoiceUrgency(b);
        const rank = { overdue: 0, 'due-soon': 1, unpaid: 2 };
        const diff = (rank[urgA] ?? 3) - (rank[urgB] ?? 3);
        if (diff !== 0) return diff;
        // Same urgency -> sort by due_date ascending (nearest first)
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dateA - dateB;
    });

    return { actionRequired, pendingVerification, completed };
}

/**
 * Aggregate financial summary across all linked children for household-level display.
 */
export function buildHouseholdFinanceSummary(children = []) {
    const safe = Array.isArray(children) ? children : [];

    const totalOutstanding = safe.reduce((sum, c) => sum + (Number(c.unpaid_amount) || 0), 0);
    const totalOutstandingInvoices = safe.reduce((sum, c) => sum + (Number(c.unpaid_invoices_count) || 0), 0);
    const childrenWithDebt = safe.filter((c) => (Number(c.unpaid_amount) || 0) > 0);

    return {
        totalOutstanding,
        totalOutstandingInvoices,
        childrenCount: safe.length,
        childrenWithDebtCount: childrenWithDebt.length,
        childrenWithDebt: childrenWithDebt.map((c) => ({
            id: c.id,
            name: c.full_name,
            amount: Number(c.unpaid_amount) || 0,
            invoiceCount: Number(c.unpaid_invoices_count) || 0,
        })),
    };
}

/**
 * Pick the single most urgent invoice that needs parent attention.
 * Priority: overdue > due-soon > unpaid > pending > paid
 * Within same urgency: nearest due_date wins.
 */
export function getPriorityInvoice(invoices = []) {
    const safe = Array.isArray(invoices) ? invoices : [];
    if (safe.length === 0) return null;

    const urgencyRank = { overdue: 0, 'due-soon': 1, unpaid: 2, pending: 3, paid: 4, cancelled: 5 };

    let best = null;
    let bestRank = 99;
    let bestDue = Infinity;

    for (const inv of safe) {
        const urg = getInvoiceUrgency(inv);
        const rank = urgencyRank[urg] ?? 99;
        const dueTime = inv.due_date ? new Date(inv.due_date).getTime() : Infinity;

        if (rank < bestRank || (rank === bestRank && dueTime < bestDue)) {
            best = inv;
            bestRank = rank;
            bestDue = dueTime;
        }
    }

    return best;
}

export function buildParentChildDetailNavigation(studentName = 'học viên này') {
    const safeStudentName = studentName || 'học viên này';

    return {
        sectionLabel: 'Mục theo dõi trong hồ sơ học viên',
        description: `Các mục bên dưới chỉ áp dụng cho riêng ${safeStudentName}, giúp phụ huynh theo dõi từng hồ sơ mà không nhầm với menu chung ở thanh bên.`,
        tabs: [
            { value: 'schedule', label: 'Lịch theo lớp' },
            { value: 'grades', label: 'Kết quả học tập' },
            { value: 'attendance', label: 'Chuyên cần' },
            { value: 'invoices', label: 'Thanh toán' },
        ],
    };
}

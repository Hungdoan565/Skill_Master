import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildParentChildDetailNavigation,
    buildParentChildOverview,
    buildParentDashboardInsights,
    buildParentGradesGroups,
    buildInvoiceGroups,
    buildHouseholdFinanceSummary,
    buildParentScheduleGroups,
    getPriorityInvoice,
} from './insights.js';

test('buildParentDashboardInsights creates action items and summary from linked students', () => {
    const result = buildParentDashboardInsights({
        children: [
            {
                id: 'student-1',
                full_name: 'Hưng Đoàn',
                center_name: 'Skill Master Main Center',
                active_classes_count: 2,
                unpaid_amount: 1500000,
                unpaid_invoices_count: 2,
            },
            {
                id: 'student-2',
                full_name: 'Bé An',
                center_name: 'Skill Master Main Center',
                active_classes_count: 1,
                unpaid_amount: 0,
                unpaid_invoices_count: 0,
            },
        ],
    });

    assert.equal(result.summary.linkedStudents, 2);
    assert.equal(result.summary.studentsWithClasses, 2);
    assert.equal(result.summary.totalOutstanding, 1500000);
    assert.equal(result.actions.length, 1);
    assert.equal(result.actions[0].studentId, 'student-1');
    assert.equal(result.actions[0].severity, 'high');
    assert.match(result.actions[0].title, /thanh toán/i);
});

test('buildParentChildOverview creates meaningful hero metrics from academics, attendance, schedule, and invoices', () => {
    const result = buildParentChildOverview({
        child: {
            id: 'student-1',
            full_name: 'Hưng Đoàn',
            active_classes_count: 2,
            unpaid_amount: 500000,
            unpaid_invoices_count: 1,
        },
        attendance: [
            { status: 'present' },
            { status: 'present' },
            { status: 'late' },
            { status: 'absent' },
        ],
        grades: [
            { score: 8.5, className: 'IELTS 5.5+' },
            { score: 7.5, className: 'IELTS 5.5+' },
        ],
        schedule: [
            { className: 'IELTS 5.5+', dayOfWeek: 2, startTime: '18:00:00', endTime: '20:00:00' },
        ],
        invoices: [
            { status: 'unpaid', final_amount: 500000, paid_amount: 0, due_date: '2026-03-20' },
        ],
    });

    assert.equal(result.heroMetrics.length, 4);
    assert.equal(result.heroMetrics[0].label, 'Lớp đang theo học');
    assert.equal(result.heroMetrics[0].value, '2');
    assert.equal(result.heroMetrics[1].label, 'Chuyên cần');
    assert.equal(result.heroMetrics[1].value, '75%');
    assert.equal(result.heroMetrics[2].label, 'Điểm gần nhất');
    assert.equal(result.heroMetrics[2].value, '8.5');
    assert.equal(result.heroMetrics[3].label, 'Cần thanh toán');
    assert.equal(result.heroMetrics[3].value.replace(/\s/g, ' '), '500.000 ₫');

    assert.match(result.nextSession.title, /IELTS/);
    assert.match(result.financialStatus.description, /1 hóa đơn/i);
});

// ─── New tests for finance insight functions ──────────────────────

test('buildInvoiceGroups sorts invoices into 3 correct buckets', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const invoices = [
        { id: 'a', status: 'overdue', due_date: yesterday.toISOString(), final_amount: 1000000 },
        { id: 'b', status: 'unpaid', due_date: '2026-12-01', final_amount: 500000 },
        { id: 'c', status: 'pending', due_date: '2026-04-01', final_amount: 300000 },
        { id: 'd', status: 'paid', final_amount: 2000000 },
        { id: 'e', status: 'cancelled', final_amount: 100000 },
    ];

    const groups = buildInvoiceGroups(invoices);

    assert.equal(groups.actionRequired.length, 2); // overdue + unpaid
    assert.equal(groups.pendingVerification.length, 1); // pending
    assert.equal(groups.completed.length, 2); // paid + cancelled

    // overdue should come first in actionRequired
    assert.equal(groups.actionRequired[0].id, 'a');
});

test('buildInvoiceGroups handles empty array', () => {
    const groups = buildInvoiceGroups([]);
    assert.equal(groups.actionRequired.length, 0);
    assert.equal(groups.pendingVerification.length, 0);
    assert.equal(groups.completed.length, 0);
});

test('buildHouseholdFinanceSummary aggregates across children', () => {
    const children = [
        { id: 's1', full_name: 'Hưng', unpaid_amount: 1000000, unpaid_invoices_count: 2 },
        { id: 's2', full_name: 'An', unpaid_amount: 0, unpaid_invoices_count: 0 },
        { id: 's3', full_name: 'Bình', unpaid_amount: 500000, unpaid_invoices_count: 1 },
    ];

    const summary = buildHouseholdFinanceSummary(children);

    assert.equal(summary.totalOutstanding, 1500000);
    assert.equal(summary.totalOutstandingInvoices, 3);
    assert.equal(summary.childrenCount, 3);
    assert.equal(summary.childrenWithDebtCount, 2);
    assert.equal(summary.childrenWithDebt.length, 2);
    assert.equal(summary.childrenWithDebt[0].name, 'Hưng');
    assert.equal(summary.childrenWithDebt[1].name, 'Bình');
});

test('buildHouseholdFinanceSummary handles empty/null input', () => {
    const summary = buildHouseholdFinanceSummary(null);
    assert.equal(summary.totalOutstanding, 0);
    assert.equal(summary.childrenCount, 0);
});

test('getPriorityInvoice picks overdue invoice first', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const invoices = [
        { id: 'a', status: 'unpaid', due_date: nextWeek.toISOString(), final_amount: 2000000 },
        { id: 'b', status: 'overdue', due_date: yesterday.toISOString(), final_amount: 500000 },
        { id: 'c', status: 'paid', final_amount: 1000000 },
    ];

    const priority = getPriorityInvoice(invoices);
    assert.equal(priority.id, 'b'); // overdue wins regardless of amount
});

test('getPriorityInvoice picks nearest due_date among same urgency', () => {
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    const inOneDays = new Date();
    inOneDays.setDate(inOneDays.getDate() + 1);

    const invoices = [
        { id: 'a', status: 'unpaid', due_date: inTwoDays.toISOString() },
        { id: 'b', status: 'unpaid', due_date: inOneDays.toISOString() },
    ];

    const priority = getPriorityInvoice(invoices);
    assert.equal(priority.id, 'b'); // nearest due wins
});

test('getPriorityInvoice returns null for empty array', () => {
    assert.equal(getPriorityInvoice([]), null);
});

test('buildParentScheduleGroups collapses repeated weekly slots into one class group', () => {
    const result = buildParentScheduleGroups([
        {
            classId: 'class-1',
            className: 'IELTS 5.5+',
            courseTitle: 'Luyện thi IELTS',
            dayOfWeek: 4,
            startTime: '18:00:00',
            endTime: '20:00:00',
            roomName: 'Phòng 201',
        },
        {
            classId: 'class-1',
            className: 'IELTS 5.5+',
            courseTitle: 'Luyện thi IELTS',
            dayOfWeek: 2,
            startTime: '18:00:00',
            endTime: '20:00:00',
            roomName: 'Phòng 201',
        },
        {
            classId: 'class-2',
            className: 'TOEIC Foundation',
            courseTitle: 'TOEIC nền tảng',
            dayOfWeek: 7,
            startTime: '08:00:00',
            endTime: '10:00:00',
            roomName: 'Phòng 105',
        },
    ]);

    assert.equal(result.length, 2);
    assert.equal(result[0].className, 'IELTS 5.5+');
    assert.equal(result[0].slots.length, 2);
    assert.equal(result[0].slots[0].dayLabel, 'Thứ 2');
    assert.equal(result[0].slots[1].dayLabel, 'Thứ 4');
    assert.equal(result[0].slotCountLabel, '2 buổi/tuần');
    assert.equal(result[1].slotCountLabel, '1 buổi/tuần');
});

test('buildParentScheduleGroups deduplicates identical weekly slots even when backend returns many session rows', () => {
    const repeatedRows = Array.from({ length: 106 }).map((_, index) => ({
        classId: 'class-1',
        className: 'Giao tiếp - Lớp 2',
        courseTitle: 'Python Cơ bản',
        dayOfWeek: index < 2 ? 3 : 4,
        startTime: index < 2 ? '08:00:00' : '18:30:00',
        endTime: index < 2 ? '10:00:00' : '20:30:00',
        roomName: 'PVIP2',
    }));

    const result = buildParentScheduleGroups(repeatedRows);

    assert.equal(result.length, 1);
    assert.equal(result[0].slots.length, 2);
    assert.deepEqual(
        result[0].slots.map((slot) => ({ day: slot.dayLabel, time: slot.timeLabel })),
        [
            { day: 'Thứ 3', time: '08:00 - 10:00' },
            { day: 'Thứ 4', time: '18:30 - 20:30' },
        ],
    );
    assert.equal(result[0].slotCountLabel, '2 buổi/tuần');
});

test('buildParentChildDetailNavigation returns student-scoped labels distinct from sidebar wording', () => {
    const navigation = buildParentChildDetailNavigation('Bé An');

    assert.equal(navigation.sectionLabel, 'Mục theo dõi trong hồ sơ học viên');
    assert.match(navigation.description, /chỉ áp dụng cho riêng Bé An/i);
    assert.deepEqual(
        navigation.tabs.map((tab) => tab.label),
        ['Lịch theo lớp', 'Kết quả học tập', 'Chuyên cần', 'Thanh toán'],
    );
});

test('buildParentGradesGroups groups repeated grade rows by class and keeps assessments inside one group', () => {
    const result = buildParentGradesGroups([
        {
            className: 'LT25JAVA-1225-01',
            classCode: 'LT25JAVA-1225-01',
            courseTitle: 'Java - Căn Bản',
            gradeType: 'Cuối kỳ',
            assessmentDate: '2025-12-11',
            score: 5.0,
        },
        {
            className: 'LT25JAVA-1225-01',
            classCode: 'LT25JAVA-1225-01',
            courseTitle: 'Java - Căn Bản',
            gradeType: 'Chuyên cần',
            assessmentDate: '2025-12-11',
            score: 4.0,
        },
        {
            className: 'WEB-FULLSTACK-1225-01',
            classCode: 'WEB-FULLSTACK-1225-01',
            courseTitle: 'Web Development Fullstack',
            gradeType: 'Mid-term',
            assessmentDate: '2025-12-01',
            score: 2.5,
        },
    ]);

    assert.equal(result.length, 2);
    assert.equal(result[0].className, 'LT25JAVA-1225-01');
    assert.equal(result[0].assessments.length, 2);
    assert.equal(result[0].summaryScore, 4.5);
    assert.equal(result[0].summaryLabel, 'Điểm trung bình');
    assert.equal(result[0].assessmentCountLabel, '2 đầu điểm');
    assert.equal(result[1].assessmentCountLabel, '1 đầu điểm');
});

test('buildParentGradesGroups prefers weighted average when weights exist', () => {
    const result = buildParentGradesGroups([
        {
            className: 'WEB-FULLSTACK-1225-01',
            classCode: 'WEB-FULLSTACK-1225-01',
            courseTitle: 'Web Development Fullstack',
            gradeType: 'Mid-term',
            assessmentDate: '2025-12-01',
            score: 5,
            weight: 0.4,
        },
        {
            className: 'WEB-FULLSTACK-1225-01',
            classCode: 'WEB-FULLSTACK-1225-01',
            courseTitle: 'Web Development Fullstack',
            gradeType: 'Final',
            assessmentDate: '2025-12-11',
            score: 8,
            weight: 0.6,
        },
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].summaryScore, 6.8);
    assert.equal(result[0].latestScore, 8);
});

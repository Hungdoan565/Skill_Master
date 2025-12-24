/**
 * Export utilities for Classes
 * Provides Excel export for attendance, grades, etc.
 */

import * as XLSX from 'xlsx';

/**
 * Export attendance data to Excel
 * @param {Object} params - Export parameters
 * @param {Array} params.sessions - Sessions with attendance data
 * @param {Array} params.students - Student list
 * @param {Object} params.classInfo - Class information
 * @returns {void}
 */
export function exportAttendanceToExcel({ sessions, students, classInfo }) {
    if (!sessions?.length || !students?.length) {
        throw new Error('Không có dữ liệu để xuất');
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Overview per session
    const overviewData = [
        ['BÁO CÁO ĐIỂM DANH'],
        [`Lớp: ${classInfo?.name || 'N/A'}`],
        [`Khóa học: ${classInfo?.course_name || 'N/A'}`],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        ['Buổi', 'Ngày', 'Thứ', 'Có mặt', 'Trễ', 'Vắng', 'Có phép', 'Tổng', 'Tỷ lệ']
    ];

    sessions.forEach((session, idx) => {
        const summary = session.attendance_summary || { present: 0, late: 0, absent: 0, excused: 0 };
        const total = summary.present + summary.late + summary.absent + summary.excused;
        const rate = total > 0 ? ((summary.present + summary.late) / total * 100).toFixed(1) : '0';

        overviewData.push([
            session.session_number,
            session.date,
            session.day_name,
            summary.present,
            summary.late,
            summary.absent,
            summary.excused,
            total,
            `${rate}%`
        ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);

    // Set column widths
    ws1['!cols'] = [
        { wch: 8 },   // Buổi
        { wch: 12 },  // Ngày
        { wch: 12 },  // Thứ
        { wch: 10 },  // Có mặt
        { wch: 8 },   // Trễ
        { wch: 8 },   // Vắng
        { wch: 10 }, // Có phép
        { wch: 8 },   // Tổng
        { wch: 10 }   // Tỷ lệ
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

    // Sheet 2: Detail per student
    const detailHeaders = ['STT', 'Họ tên', 'Email'];
    sessions.forEach(s => {
        detailHeaders.push(`B${s.session_number}`);
    });
    detailHeaders.push('Có mặt', 'Trễ', 'Vắng', 'Tỷ lệ');

    const detailData = [
        ['ĐIỂM DANH CHI TIẾT'],
        [`Lớp: ${classInfo?.name || 'N/A'}`],
        [],
        detailHeaders
    ];

    students.forEach((student, idx) => {
        const row = [idx + 1, student.student_name, student.student_email || ''];

        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;

        sessions.forEach(session => {
            // Find attendance for this student in this session
            const attendance = session.attendances?.find(
                a => a.student_id === student.student_id || a.enrollment_id === student.enrollment_id
            );

            if (attendance) {
                switch (attendance.status) {
                    case 'present':
                        row.push('✓');
                        presentCount++;
                        break;
                    case 'late':
                        row.push('T');
                        lateCount++;
                        break;
                    case 'absent':
                        row.push('✗');
                        absentCount++;
                        break;
                    case 'excused':
                        row.push('P');
                        break;
                    default:
                        row.push('-');
                }
            } else {
                row.push(session.is_marked ? '✗' : '-');
                if (session.is_marked) absentCount++;
            }
        });

        const totalMarked = presentCount + lateCount + absentCount;
        const attendanceRate = totalMarked > 0
            ? ((presentCount + lateCount) / totalMarked * 100).toFixed(1)
            : '-';

        row.push(presentCount, lateCount, absentCount, `${attendanceRate}%`);
        detailData.push(row);
    });

    // Legend
    detailData.push([]);
    detailData.push(['Chú thích: ✓ = Có mặt, T = Trễ, ✗ = Vắng, P = Có phép, - = Chưa điểm danh']);

    const ws2 = XLSX.utils.aoa_to_sheet(detailData);

    // Set column widths for detail sheet
    const colWidths = [
        { wch: 5 },   // STT
        { wch: 25 },  // Họ tên
        { wch: 30 },  // Email
    ];
    sessions.forEach(() => colWidths.push({ wch: 5 }));
    colWidths.push({ wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 });
    ws2['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết');

    // Generate filename
    const filename = `diem-danh_${classInfo?.name?.replace(/\s+/g, '-') || 'class'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Save
    XLSX.writeFile(wb, filename);
}

/**
 * Export grades to Excel
 * @param {Object} params - Export parameters
 */
export function exportGradesToExcel({ gradeMatrix, gradeStructures, classInfo }) {
    if (!gradeMatrix?.length) {
        throw new Error('Không có dữ liệu điểm để xuất');
    }

    const wb = XLSX.utils.book_new();

    // Headers
    const headers = ['STT', 'Họ tên', 'Email'];
    gradeStructures.forEach(s => {
        headers.push(`${s.name} (${Math.round(s.weight * 100)}%)`);
    });
    headers.push('Điểm TB', 'Kết quả');

    const data = [
        ['BẢNG ĐIỂM'],
        [`Lớp: ${classInfo?.name || 'N/A'}`],
        [`Khóa học: ${classInfo?.course_name || 'N/A'}`],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        headers
    ];

    gradeMatrix.forEach((student, idx) => {
        const row = [idx + 1, student.student_name, student.student_email || ''];

        let weightedSum = 0;
        let totalWeight = 0;

        gradeStructures.forEach(structure => {
            const grade = student.grades?.[structure.id];
            if (grade !== undefined && grade !== null) {
                row.push(grade);
                weightedSum += (grade / structure.max_score) * 10 * structure.weight;
                totalWeight += structure.weight;
            } else {
                row.push('-');
            }
        });

        const avg = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
        const result = avg !== '-' && parseFloat(avg) >= 5 ? 'Đậu' : avg !== '-' ? 'Trượt' : '-';

        row.push(avg, result);
        data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Column widths
    const colWidths = [
        { wch: 5 },   // STT
        { wch: 25 },  // Họ tên
        { wch: 30 },  // Email
    ];
    gradeStructures.forEach(() => colWidths.push({ wch: 12 }));
    colWidths.push({ wch: 10 }, { wch: 10 });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');

    const filename = `bang-diem_${classInfo?.name?.replace(/\s+/g, '-') || 'class'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
}

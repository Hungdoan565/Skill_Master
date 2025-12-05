/**
 * useGradesAdmin Hook
 * Hook quản lý điểm ở level admin - hỗ trợ nhiều lớp
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import * as XLSX from 'xlsx-js-style';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const GRADE_PASS_THRESHOLD = 5.0;

export function useGradesAdmin() {
    const { session } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [loadingClasses, setLoadingClasses] = useState(false);

    // Grade data for selected class
    const [gradeStructures, setGradeStructures] = useState([]);
    const [gradeMatrix, setGradeMatrix] = useState([]);
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [savingGrades, setSavingGrades] = useState(false);

    // Editing state
    const [editingCell, setEditingCell] = useState(null);
    const [pendingGrades, setPendingGrades] = useState({});

    // Course info
    const [courseInfo, setCourseInfo] = useState(null);

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
    }), [session?.access_token]);

    // Fetch all classes (for dropdown)
    const fetchClasses = useCallback(async () => {
        setLoadingClasses(true);
        try {
            const res = await fetch(`${API_URL}/api/classes`, {
                headers: getHeaders()
            });
            const json = await res.json();
            if (json.success) {
                // Only show classes with active students
                const activeClasses = (json.data || []).filter(
                    c => c.status === 'ongoing' || c.status === 'upcoming'
                );
                setClasses(activeClasses);

                // Auto-select first class if none selected
                if (!selectedClassId && activeClasses.length > 0) {
                    setSelectedClassId(activeClasses[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoadingClasses(false);
        }
    }, [getHeaders, selectedClassId]);

    // Fetch grades for selected class
    const fetchGrades = useCallback(async (classId = selectedClassId) => {
        if (!classId) return;

        setLoadingGrades(true);
        setPendingGrades({}); // Clear pending when switching class

        try {
            const res = await fetch(
                `${API_URL}/api/classes/${classId}/grades`,
                { headers: getHeaders() }
            );
            const json = await res.json();

            if (json.success) {
                setGradeStructures(json.data.grade_structures || []);
                setGradeMatrix(json.data.students || []);
                setCourseInfo({
                    courseId: json.data.course_id,
                    courseTitle: json.data.course_title,
                    classCode: json.data.class_code
                });
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
        } finally {
            setLoadingGrades(false);
        }
    }, [selectedClassId, getHeaders]);

    // Select a class
    const selectClass = useCallback((classId) => {
        if (classId !== selectedClassId) {
            setSelectedClassId(classId);
            setPendingGrades({});
            setEditingCell(null);
        }
    }, [selectedClassId]);

    // Update pending grade
    const updatePendingGrade = useCallback((enrollmentId, structureId, score) => {
        const key = `${enrollmentId}_${structureId}`;
        setPendingGrades(prev => ({
            ...prev,
            [key]: {
                enrollment_id: enrollmentId,
                grade_structure_id: structureId,
                score
            }
        }));
    }, []);

    // Get display score
    const getDisplayScore = useCallback((enrollmentId, structureId) => {
        const key = `${enrollmentId}_${structureId}`;

        if (pendingGrades[key] !== undefined) {
            return pendingGrades[key].score;
        }

        const student = gradeMatrix.find(s => s.enrollment_id === enrollmentId);
        return student?.grades?.[structureId]?.score ?? '';
    }, [pendingGrades, gradeMatrix]);

    // Calculate weighted average
    const calculateWeightedAverage = useCallback((enrollmentId) => {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        gradeStructures.forEach(structure => {
            const score = getDisplayScore(enrollmentId, structure.id);
            if (score !== '' && score !== null && !isNaN(score)) {
                totalWeightedScore += parseFloat(score) * structure.weight;
                totalWeight += structure.weight;
            }
        });

        return totalWeight > 0
            ? Math.round((totalWeightedScore / totalWeight) * 100) / 100
            : null;
    }, [gradeStructures, getDisplayScore]);

    // Save all pending grades
    const saveAllGrades = useCallback(async () => {
        const gradesToSave = Object.values(pendingGrades).filter(g => g.score !== '');

        if (gradesToSave.length === 0) {
            return { success: false, message: 'Không có điểm nào để lưu' };
        }

        setSavingGrades(true);
        try {
            const res = await fetch(`${API_URL}/api/grades/bulk-update`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ grades: gradesToSave })
            });

            const json = await res.json();

            if (json.success) {
                setPendingGrades({});
                setEditingCell(null);
                await fetchGrades();
                return {
                    success: true,
                    count: json.data?.length || gradesToSave.length
                };
            }
            return { success: false, message: json.message || 'Lỗi khi lưu điểm' };
        } catch (error) {
            console.error('Error saving grades:', error);
            return { success: false, message: 'Lỗi khi lưu điểm' };
        } finally {
            setSavingGrades(false);
        }
    }, [pendingGrades, getHeaders, fetchGrades]);

    // Process grade input with validation
    const processGradeInput = useCallback((enrollmentId, structureId, inputValue, maxScore) => {
        if (inputValue === '' || inputValue === null) {
            updatePendingGrade(enrollmentId, structureId, '');
            setEditingCell(null);
            return { success: true };
        }

        const numValue = parseFloat(inputValue);

        if (isNaN(numValue)) {
            setEditingCell(null);
            return { success: false, message: 'Điểm không hợp lệ' };
        }

        if (numValue < 0) {
            setEditingCell(null);
            return { success: false, message: 'Điểm không thể âm' };
        }

        if (numValue > maxScore) {
            setEditingCell(null);
            return { success: false, message: `Điểm tối đa là ${maxScore}` };
        }

        updatePendingGrade(enrollmentId, structureId, numValue);
        setEditingCell(null);
        return { success: true };
    }, [updatePendingGrade]);

    // Check if cell is pending
    const isCellPending = useCallback((enrollmentId, structureId) => {
        const key = `${enrollmentId}_${structureId}`;
        return pendingGrades[key] !== undefined;
    }, [pendingGrades]);

    // Clear pending
    const clearPendingGrades = useCallback(() => {
        setPendingGrades({});
        setEditingCell(null);
    }, []);

    // Statistics
    const statistics = useMemo(() => {
        const totalStudents = gradeMatrix.length;
        let gradedCount = 0;
        let passCount = 0;
        let failCount = 0;
        let totalScore = 0;

        gradeMatrix.forEach(student => {
            const avg = calculateWeightedAverage(student.enrollment_id);
            if (avg !== null) {
                gradedCount++;
                totalScore += avg;
                if (avg >= GRADE_PASS_THRESHOLD) {
                    passCount++;
                } else {
                    failCount++;
                }
            }
        });

        return {
            totalStudents,
            gradedCount,
            notGradedCount: totalStudents - gradedCount,
            passCount,
            failCount,
            passRate: gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0,
            averageScore: gradedCount > 0 ? (totalScore / gradedCount).toFixed(2) : 'N/A'
        };
    }, [gradeMatrix, calculateWeightedAverage]);

    // Export functions
    const exportToCSV = useCallback(() => {
        if (gradeMatrix.length === 0 || gradeStructures.length === 0) {
            return { success: false, message: 'Không có dữ liệu để xuất' };
        }

        // Build CSV header
        let csv = 'STT,Họ tên,Email';
        gradeStructures.forEach(s => {
            csv += `,${s.name} (${Math.round(s.weight * 100)}%)`;
        });
        csv += ',Điểm TB,Kết quả\n';

        // Build CSV rows
        gradeMatrix.forEach((student, index) => {
            const avg = calculateWeightedAverage(student.enrollment_id);
            const result = avg !== null ? (avg >= GRADE_PASS_THRESHOLD ? 'Đậu' : 'Trượt') : 'Chưa có';

            csv += `${index + 1},${student.student_name},${student.student_email}`;
            gradeStructures.forEach(s => {
                const score = getDisplayScore(student.enrollment_id, s.id);
                csv += `,${score !== '' ? score : ''}`;
            });
            csv += `,${avg !== null ? avg.toFixed(2) : ''},${result}\n`;
        });

        // Download
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `BangDiem_${courseInfo?.classCode || 'class'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        return { success: true };
    }, [gradeMatrix, gradeStructures, courseInfo, calculateWeightedAverage, getDisplayScore]);

    // Export JSON (for backup)
    const exportToJSON = useCallback(() => {
        const exportData = {
            exportedAt: new Date().toISOString(),
            classCode: courseInfo?.classCode,
            courseTitle: courseInfo?.courseTitle,
            gradeStructures: gradeStructures.map(s => ({
                name: s.name,
                weight: s.weight,
                maxScore: s.max_score
            })),
            students: gradeMatrix.map(student => ({
                name: student.student_name,
                email: student.student_email,
                grades: gradeStructures.reduce((acc, s) => {
                    acc[s.name] = getDisplayScore(student.enrollment_id, s.id) || null;
                    return acc;
                }, {}),
                weightedAverage: calculateWeightedAverage(student.enrollment_id)
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `BangDiem_${courseInfo?.classCode || 'class'}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        return { success: true };
    }, [gradeMatrix, gradeStructures, courseInfo, getDisplayScore, calculateWeightedAverage]);

    // Export to styled Excel
    const exportToExcel = useCallback(() => {
        if (gradeMatrix.length === 0 || gradeStructures.length === 0) {
            return { success: false, message: 'Không có dữ liệu để xuất' };
        }

        // Define styles
        const headerStyle = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
            fill: { fgColor: { rgb: '4F46E5' } }, // Indigo
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
            }
        };

        const subHeaderStyle = {
            font: { sz: 10, color: { rgb: '666666' } },
            fill: { fgColor: { rgb: 'E0E7FF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
            }
        };

        const dataStyle = {
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                right: { style: 'thin', color: { rgb: 'CCCCCC' } }
            }
        };

        const passStyle = {
            ...dataStyle,
            font: { bold: true, color: { rgb: '059669' } },
            fill: { fgColor: { rgb: 'D1FAE5' } }
        };

        const failStyle = {
            ...dataStyle,
            font: { bold: true, color: { rgb: 'DC2626' } },
            fill: { fgColor: { rgb: 'FEE2E2' } }
        };

        const titleStyle = {
            font: { bold: true, sz: 16, color: { rgb: '1E293B' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Build worksheet data
        const wsData = [];

        // Title rows
        wsData.push([{ v: `BẢNG ĐIỂM LỚP ${courseInfo?.classCode || ''}`, s: titleStyle }]);
        wsData.push([{ v: `Khóa học: ${courseInfo?.courseTitle || 'N/A'}`, s: { font: { sz: 12, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } } }]);
        wsData.push([{ v: `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, s: { font: { sz: 10, color: { rgb: '94A3B8' } }, alignment: { horizontal: 'center' } } }]);
        wsData.push([]); // Empty row

        // Header row
        const headerRow = [
            { v: 'STT', s: headerStyle },
            { v: 'Họ và tên', s: headerStyle },
            { v: 'Email', s: headerStyle }
        ];
        gradeStructures.forEach(s => {
            headerRow.push({ v: s.name, s: headerStyle });
        });
        headerRow.push({ v: 'Điểm TB', s: { ...headerStyle, fill: { fgColor: { rgb: '059669' } } } });
        headerRow.push({ v: 'Kết quả', s: headerStyle });
        wsData.push(headerRow);

        // Sub-header row (weights)
        const subHeaderRow = [
            { v: '', s: subHeaderStyle },
            { v: '', s: subHeaderStyle },
            { v: '', s: subHeaderStyle }
        ];
        gradeStructures.forEach(s => {
            subHeaderRow.push({ v: `${Math.round(s.weight * 100)}% - Max ${s.max_score}`, s: subHeaderStyle });
        });
        subHeaderRow.push({ v: 'Thang 10', s: subHeaderStyle });
        subHeaderRow.push({ v: `≥${GRADE_PASS_THRESHOLD} Đậu`, s: subHeaderStyle });
        wsData.push(subHeaderRow);

        // Data rows
        gradeMatrix.forEach((student, index) => {
            const avg = calculateWeightedAverage(student.enrollment_id);
            const passed = avg !== null && avg >= GRADE_PASS_THRESHOLD;

            const row = [
                { v: index + 1, s: dataStyle },
                { v: student.student_name, s: { ...dataStyle, alignment: { horizontal: 'left' } } },
                { v: student.student_email, s: { ...dataStyle, alignment: { horizontal: 'left' } } }
            ];

            gradeStructures.forEach(s => {
                const score = getDisplayScore(student.enrollment_id, s.id);
                row.push({
                    v: score !== '' && score !== null ? parseFloat(score) : '',
                    s: dataStyle,
                    t: score !== '' && score !== null ? 'n' : 's'
                });
            });

            row.push({
                v: avg !== null ? avg : '',
                s: avg !== null ? (passed ? passStyle : failStyle) : dataStyle,
                t: avg !== null ? 'n' : 's'
            });
            row.push({
                v: avg !== null ? (passed ? 'Đậu' : 'Trượt') : '',
                s: avg !== null ? (passed ? passStyle : failStyle) : dataStyle
            });

            wsData.push(row);
        });

        // Statistics row
        wsData.push([]);
        wsData.push([
            { v: 'THỐNG KÊ:', s: { font: { bold: true } } },
            { v: `Tổng: ${statistics.totalStudents}`, s: dataStyle },
            { v: `Đậu: ${statistics.passCount}`, s: passStyle },
            { v: `Trượt: ${statistics.failCount}`, s: failStyle },
            { v: `Tỷ lệ đậu: ${statistics.passRate}%`, s: dataStyle },
            { v: `Điểm TB lớp: ${statistics.averageScore}`, s: dataStyle }
        ]);

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // STT
            { wch: 25 },  // Name
            { wch: 30 },  // Email
            ...gradeStructures.map(() => ({ wch: 12 })),
            { wch: 10 },  // Average
            { wch: 10 }   // Result
        ];

        // Merge title cells
        const totalCols = 3 + gradeStructures.length + 2;
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } }
        ];

        // Create workbook and save
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');
        XLSX.writeFile(wb, `BangDiem_${courseInfo?.classCode || 'class'}_${new Date().toISOString().split('T')[0]}.xlsx`);

        return { success: true };
    }, [gradeMatrix, gradeStructures, courseInfo, getDisplayScore, calculateWeightedAverage, statistics]);

    return {
        // Class selection
        classes,
        selectedClassId,
        loadingClasses,
        fetchClasses,
        selectClass,

        // Grade data
        gradeStructures,
        gradeMatrix,
        loadingGrades,
        savingGrades,
        courseInfo,
        fetchGrades,

        // Editing
        editingCell,
        setEditingCell,
        pendingGrades,
        hasPendingChanges: Object.keys(pendingGrades).length > 0,

        // Actions
        updatePendingGrade,
        saveAllGrades,
        processGradeInput,
        clearPendingGrades,

        // Computed
        getDisplayScore,
        calculateWeightedAverage,
        isCellPending,

        // Statistics
        statistics,
        GRADE_PASS_THRESHOLD,

        // Export
        exportToCSV,
        exportToJSON,
        exportToExcel,
        getHeaders
    };
}

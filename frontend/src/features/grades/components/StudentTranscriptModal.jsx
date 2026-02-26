/**
 * StudentTranscriptModal - Modal xem bảng điểm tổng hợp của học viên
 */

import { useState, useEffect, useCallback } from 'react';
import {
    X,
    GraduationCap,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    BookOpen,
    Award,
    Download,
    FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx-js-style';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function StudentTranscriptModal({ studentId, studentName, isOpen, onClose }) {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [transcriptData, setTranscriptData] = useState(null);

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
    }), [session?.access_token]);

    // Fetch transcript data
    useEffect(() => {
        if (isOpen && studentId) {
            fetchTranscript();
        }
    }, [isOpen, studentId]);

    const fetchTranscript = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/students/${studentId}/transcript`, {
                headers: getHeaders()
            });
            const json = await res.json();

            if (json.success) {
                setTranscriptData(json.data);
            } else {
                setError(json.message || 'Không thể tải bảng điểm');
            }
        } catch (err) {
            console.error('Error fetching transcript:', err);
            setError('Lỗi khi tải bảng điểm');
        } finally {
            setLoading(false);
        }
    };

    // Export to Excel
    const handleExport = () => {
        if (!transcriptData) return;

        const { student, transcript, statistics } = transcriptData;

        // Define styles
        const headerStyle = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '4F46E5' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
            }
        };

        const titleStyle = {
            font: { bold: true, sz: 16, color: { rgb: '1E293B' } },
            alignment: { horizontal: 'center' }
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

        const passStyle = { ...dataStyle, font: { bold: true, color: { rgb: '059669' } }, fill: { fgColor: { rgb: 'D1FAE5' } } };
        const failStyle = { ...dataStyle, font: { bold: true, color: { rgb: 'DC2626' } }, fill: { fgColor: { rgb: 'FEE2E2' } } };

        // Build worksheet
        const wsData = [];

        // Title
        wsData.push([{ v: `BẢNG ĐIỂM TỔNG HỢP`, s: titleStyle }]);
        wsData.push([{ v: `Học viên: ${student.fullName}`, s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } } }]);
        wsData.push([{ v: `Email: ${student.email}`, s: { font: { sz: 10, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } } }]);
        wsData.push([{ v: `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, s: { font: { sz: 10, color: { rgb: '94A3B8' } }, alignment: { horizontal: 'center' } } }]);
        wsData.push([]);

        // Header
        wsData.push([
            { v: 'STT', s: headerStyle },
            { v: 'Khóa học', s: headerStyle },
            { v: 'Lớp học', s: headerStyle },
            { v: 'Thời gian', s: headerStyle },
            { v: 'Điểm TB', s: headerStyle },
            { v: 'Kết quả', s: headerStyle }
        ]);

        // Data rows
        transcript.forEach((item, index) => {
            const passed = item.summary.passed;
            wsData.push([
                { v: index + 1, s: dataStyle },
                { v: item.course.title, s: { ...dataStyle, alignment: { horizontal: 'left' } } },
                { v: `${item.class.code} - ${item.class.name}`, s: { ...dataStyle, alignment: { horizontal: 'left' } } },
                { v: item.class.startDate ? new Date(item.class.startDate).toLocaleDateString('vi-VN') : 'N/A', s: dataStyle },
                { v: item.summary.weightedAverage !== null ? item.summary.weightedAverage : '', s: item.summary.weightedAverage !== null ? (passed ? passStyle : failStyle) : dataStyle, t: item.summary.weightedAverage !== null ? 'n' : 's' },
                { v: item.summary.weightedAverage !== null ? (passed ? 'Đậu' : 'Trượt') : 'Chưa có', s: item.summary.weightedAverage !== null ? (passed ? passStyle : failStyle) : dataStyle }
            ]);
        });

        // Statistics
        wsData.push([]);
        wsData.push([
            { v: 'TỔNG KẾT:', s: { font: { bold: true } } },
            { v: `${statistics.totalClasses} lớp`, s: dataStyle },
            { v: `${statistics.passedClasses} đậu`, s: passStyle },
            { v: `${statistics.failedClasses} trượt`, s: failStyle },
            { v: `TB: ${statistics.averageScore}`, s: dataStyle },
            { v: '', s: dataStyle }
        ]);

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 5 },
            { wch: 30 },
            { wch: 25 },
            { wch: 15 },
            { wch: 10 },
            { wch: 10 }
        ];
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transcript');
        XLSX.writeFile(wb, `Transcript_${student.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Bảng điểm tổng hợp</h2>
                            <p className="text-sm text-slate-500">{studentName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {transcriptData && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Xuất Excel
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-slate-600">Đang tải bảng điểm...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-600">{error}</p>
                            <Button variant="outline" onClick={fetchTranscript} className="mt-4">
                                Thử lại
                            </Button>
                        </div>
                    ) : transcriptData ? (
                        <>
                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <StatCard
                                    label="Tổng lớp học"
                                    value={transcriptData.statistics.totalClasses}
                                    icon={BookOpen}
                                    color="bg-blue-50 text-blue-600"
                                />
                                <StatCard
                                    label="Đã hoàn thành"
                                    value={transcriptData.statistics.completedClasses}
                                    icon={CheckCircle2}
                                    color="bg-emerald-50 text-emerald-600"
                                />
                                <StatCard
                                    label="Số lớp đậu"
                                    value={transcriptData.statistics.passedClasses}
                                    icon={Award}
                                    color="bg-indigo-50 text-indigo-600"
                                />
                                <StatCard
                                    label="Điểm TB"
                                    value={transcriptData.statistics.averageScore}
                                    icon={GraduationCap}
                                    color="bg-amber-50 text-amber-600"
                                />
                            </div>

                            {/* Transcript Table */}
                            {transcriptData.transcript.length > 0 ? (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Khóa học</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lớp</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Thời gian</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Điểm TB</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Kết quả</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transcriptData.transcript.map((item, index) => (
                                                <TranscriptRow key={item.enrollmentId} item={item} index={index} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-lg">
                                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600">Chưa có dữ liệu học tập</p>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className={cn('rounded-lg p-4', color)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</span>
                <Icon className="w-4 h-4 opacity-75" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

function TranscriptRow({ item, index }) {
    const { course, class: cls, summary, grades, gradeColumns } = item;
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-4 py-3">
                    <div>
                        <p className="font-medium text-slate-900">{course.title}</p>
                        <p className="text-xs text-slate-500">{course.category}</p>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span className="text-sm">{cls.code}</span>
                </td>
                <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {cls.startDate ? new Date(cls.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={cn(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        cls.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            cls.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                    )}>
                        {cls.status === 'completed' ? 'Hoàn thành' : cls.status === 'ongoing' ? 'Đang học' : 'Sắp tới'}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={cn(
                        'text-sm font-semibold',
                        summary.weightedAverage !== null
                            ? summary.passed ? 'text-emerald-600' : 'text-red-600'
                            : 'text-slate-400'
                    )}>
                        {summary.weightedAverage !== null ? summary.weightedAverage.toFixed(2) : '—'}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">
                    {summary.weightedAverage !== null ? (
                        summary.passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Đậu
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertCircle className="w-3 h-3" />
                                Trượt
                            </span>
                        )
                    ) : (
                        <span className="text-xs text-slate-400">Chưa có</span>
                    )}
                </td>
            </tr>
            {/* Expanded grades detail */}
            {expanded && gradeColumns.length > 0 && (
                <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                            {gradeColumns.map(col => {
                                const grade = grades[col.name];
                                return (
                                    <div key={col.name} className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                        <p className="text-xs text-slate-500 mb-1">{col.name} ({Math.round(col.weight * 100)}%)</p>
                                        <p className="font-semibold">
                                            {grade?.score !== null ? `${grade.score}/${col.maxScore}` : '—'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default StudentTranscriptModal;

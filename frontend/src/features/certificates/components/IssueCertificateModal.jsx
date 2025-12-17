/**
 * IssueCertificateModal - Modal cấp chứng chỉ với auto-check eligibility
 * 
 * Features:
 * - Kiểm tra điều kiện tự động (điểm danh %, điểm TB)
 * - Hiển thị lý do không đủ điều kiện
 * - Input override reason nếu cần đặc cách
 * - Submit với validation
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    X,
    Award,
    CheckCircle,
    AlertCircle,
    Loader2,
    TrendingUp,
    Users,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const IssueCertificateModal = ({
    isOpen,
    onClose,
    student,
    classData,
    certificateType,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [eligibility, setEligibility] = useState(null);
    const [overrideReason, setOverrideReason] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState(null);

    // Check eligibility when modal opens
    useEffect(() => {
        if (isOpen && student && classData && certificateType) {
            checkEligibility();
        }
    }, [isOpen, student?.id, classData?.id, certificateType?.id]);

    const checkEligibility = async () => {
        setChecking(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Chưa đăng nhập');

            const response = await fetch(
                `${API_URL}/api/students/${student.id}/certificate-eligibility/${certificateType.id}?classId=${classData.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setEligibility(data.data);
            } else {
                setError(data.message || 'Không thể kiểm tra điều kiện');
            }
        } catch (err) {
            console.error('Error checking eligibility:', err);
            setError('Lỗi khi kiểm tra điều kiện');
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate override reason if not eligible
        if (eligibility && !eligibility.eligible && !overrideReason.trim()) {
            setError('Vui lòng nhập lý do đặc cách khi học viên chưa đủ điều kiện');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Chưa đăng nhập');

            const response = await fetch(`${API_URL}/api/admin/certificates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: student.id,
                    class_id: classData.id,
                    certificate_type_id: certificateType.id,
                    issue_date: issueDate,
                    override_reason: overrideReason.trim() || null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess && onSuccess(data.data);
                onClose();
            } else {
                // Handle requiresOverride response
                if (data.requiresOverride) {
                    setEligibility(data.eligibility);
                    setError('Học viên chưa đủ điều kiện. Vui lòng nhập lý do đặc cách.');
                } else {
                    setError(data.message || 'Không thể cấp chứng chỉ');
                }
            }
        } catch (err) {
            console.error('Error issuing certificate:', err);
            setError('Lỗi khi cấp chứng chỉ');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100">
                            <Award className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Cấp chứng chỉ</h2>
                            <p className="text-sm text-slate-500">{certificateType?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Student Info */}
                    <Card>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                                    {student?.full_name?.[0]?.toUpperCase() || 'S'}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{student?.full_name}</p>
                                    <p className="text-sm text-slate-500">{student?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Users className="h-4 w-4" />
                                <span>Lớp: {classData?.name}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Eligibility Check */}
                    {checking ? (
                        <Card>
                            <div className="p-6 flex items-center justify-center gap-3 text-slate-500">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Đang kiểm tra điều kiện...</span>
                            </div>
                        </Card>
                    ) : eligibility ? (
                        <Card>
                            <div className="p-4 space-y-4">
                                {/* Eligibility Status */}
                                <div className={`flex items-start gap-3 p-3 rounded-lg ${eligibility.eligible
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-amber-50 border border-amber-200'
                                    }`}>
                                    {eligibility.eligible ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <p className={`font-semibold ${eligibility.eligible ? 'text-green-700' : 'text-amber-700'
                                            }`}>
                                            {eligibility.eligible
                                                ? '✓ Học viên đủ điều kiện'
                                                : '⚠ Học viên chưa đủ điều kiện'}
                                        </p>
                                        {!eligibility.eligible && eligibility.reasons && eligibility.reasons.length > 0 && (
                                            <ul className="mt-2 space-y-1 text-sm text-amber-700">
                                                {eligibility.reasons.map((reason, idx) => (
                                                    <li key={idx}>• {reason}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Attendance Rate */}
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                            <Users className="h-4 w-4" />
                                            <span>Tỷ lệ điểm danh</span>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {eligibility.attendance_rate?.toFixed(1) || 0}%
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Yêu cầu: ≥{eligibility.min_attendance_required || 0}%
                                        </p>
                                    </div>

                                    {/* Average Grade */}
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Điểm trung bình</span>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {eligibility.average_grade?.toFixed(1) || 'N/A'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Yêu cầu: ≥{eligibility.min_grade_required || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Override Reason Input (if not eligible) */}
                                {!eligibility.eligible && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Lý do đặc cách <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={overrideReason}
                                            onChange={(e) => setOverrideReason(e.target.value)}
                                            placeholder="Ví dụ: Theo quyết định của Ban Giám hiệu, học viên được miễn điều kiện do..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                            rows={3}
                                            required={!eligibility.eligible}
                                        />
                                        <p className="text-xs text-slate-500">
                                            * Bắt buộc nhập lý do khi học viên chưa đủ điều kiện
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ) : null}

                    {/* Issue Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Ngày cấp
                        </label>
                        <Input
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || checking}
                            className="min-w-[120px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang cấp...
                                </>
                            ) : (
                                <>
                                    <Award className="h-4 w-4 mr-2" />
                                    Cấp chứng chỉ
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

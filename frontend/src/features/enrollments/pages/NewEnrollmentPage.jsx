/**
 * NewEnrollmentPage - Trang ghi danh học viên vào lớp
 * 
 * Features:
 * - Chọn học viên từ danh sách
 * - Chọn lớp học
 * - Ghi danh đơn lẻ hoặc hàng loạt
 * - Tạo hóa đơn tự động (optional)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    BookOpen,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    ChevronDown,
    Plus,
    UserPlus,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useEnrollments } from '../hooks';
import { formatDate, formatCurrency } from '../utils';

// Student Selection Item
const StudentSelectItem = ({ student, selected, onToggle }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div
            onClick={() => onToggle(student.id)}
            className={`
        p-4 border rounded-lg cursor-pointer transition-all
        ${selected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
      `}
        >
            <div className="flex items-center gap-3">
                <div className={`
          h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold
          ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}
        `}>
                    {selected ? <CheckCircle className="h-5 w-5" /> : getInitials(student.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
                    <p className="text-sm text-slate-500 truncate">{student.email}</p>
                </div>
            </div>
        </div>
    );
};

// Class Selection Item
const ClassSelectItem = ({ classItem, selected, onClick }) => {
    const availableSpots = classItem.max_students - (classItem.enrolled_count || 0);
    const isFull = availableSpots <= 0;

    return (
        <div
            onClick={() => !isFull && onClick(classItem.id)}
            className={`
        p-4 border rounded-lg transition-all
        ${isFull
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : selected
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                }
      `}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{classItem.name}</p>
                        {selected && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{classItem.courses?.title || 'N/A'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>GV: {classItem.teacher?.full_name || classItem.teachers?.full_name || classItem.users?.full_name || 'Chưa phân công'}</span>
                        <span>•</span>
                        <span>{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                    </div>
                </div>
                <div className="text-right">
                    <Badge variant={isFull ? 'destructive' : availableSpots <= 5 ? 'warning' : 'success'}>
                        {isFull ? 'Đã đầy' : `Còn ${availableSpots} chỗ`}
                    </Badge>
                    <p className="text-sm font-medium text-slate-900 mt-2">
                        {formatCurrency(classItem.courses?.tuition_fee)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export function NewEnrollmentPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isManager, getCenterId, isSuperAdmin, profile } = useAuth();

    // Get pre-selected values from URL
    const preSelectedClassId = searchParams.get('class_id');
    const preSelectedStudentId = searchParams.get('student_id');

    // States
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState(preSelectedClassId || '');
    const [studentSearch, setStudentSearch] = useState('');
    const [classSearch, setClassSearch] = useState('');
    // 🔥 REMOVED: createInvoice state - always create draft invoice now
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState('');
    const [centers, setCenters] = useState([]);

    const {
        students,
        classes,
        loading,
        fetchStudents,
        fetchClasses,
        createBulkEnrollment,
    } = useEnrollments();

    // Get effective center ID
    const effectiveCenterId = useMemo(() => {
        if (isSuperAdmin()) {
            return selectedCenter || null;
        }
        return getCenterId();
    }, [isSuperAdmin, selectedCenter, getCenterId]);

    // Fetch centers for SUPER_ADMIN
    useEffect(() => {
        if (isSuperAdmin()) {
            const fetchCenters = async () => {
                try {
                    const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/centers`,
                        { headers: { Authorization: `Bearer ${session?.access_token}` } }
                    );
                    const result = await response.json();
                    if (result.success) {
                        setCenters(result.data || []);
                        if (result.data?.length > 0 && !selectedCenter) {
                            setSelectedCenter(result.data[0].id);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching centers:', err);
                }
            };
            fetchCenters();
        } else {
            setSelectedCenter(getCenterId());
        }
    }, [isSuperAdmin, getCenterId, selectedCenter]);

    // Fetch classes on mount and when center changes
    useEffect(() => {
        if (effectiveCenterId) {
            fetchClasses(effectiveCenterId);
        }
    }, [effectiveCenterId, fetchClasses]);

    // Debounced server-side student search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (effectiveCenterId || isSuperAdmin()) {
                fetchStudents(effectiveCenterId, studentSearch);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [studentSearch, effectiveCenterId, fetchStudents, isSuperAdmin]);

    // Handle pre-selected student
    useEffect(() => {
        if (preSelectedStudentId && students.length > 0) {
            setSelectedStudents([preSelectedStudentId]);
        }
    }, [preSelectedStudentId, students]);

    // Students are now server-filtered
    const filteredStudents = students;

    // Filter classes
    const filteredClasses = useMemo(() => {
        if (!classSearch) return classes;
        const term = classSearch.toLowerCase();
        return classes.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.code?.toLowerCase().includes(term) ||
            c.courses?.title?.toLowerCase().includes(term)
        );
    }, [classes, classSearch]);

    // Toggle student selection
    const toggleStudent = useCallback((studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    }, []);

    // Select/Deselect all filtered students
    const toggleAllStudents = useCallback(() => {
        const filteredIds = filteredStudents.map(s => s.id);
        const allSelected = filteredIds.every(id => selectedStudents.includes(id));

        if (allSelected) {
            setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            setSelectedStudents(prev => [...new Set([...prev, ...filteredIds])]);
        }
    }, [filteredStudents, selectedStudents]);

    // Submit enrollment
    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            setError('Vui lòng chọn ít nhất một học viên');
            return;
        }
        if (!selectedClass) {
            setError('Vui lòng chọn lớp học');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // 🔥 UPDATED: Use API response message which includes invoice count
            const result = await createBulkEnrollment(selectedClass, selectedStudents);

            // Show success message from API (includes invoice count)
            const successMsg = result?.message || `Đã ghi danh ${selectedStudents.length} học viên thành công!`;
            setSuccess(successMsg);

            // Warn if some invoices failed
            if (result?.invoice_errors?.length > 0) {
                console.warn('Some invoices failed:', result.invoice_errors);
            }

            // Reset và redirect sau 2s
            setTimeout(() => {
                navigate(`/admin/classes/${selectedClass}`);
            }, 2000);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi ghi danh');
        } finally {
            setSubmitting(false);
        }
    };

    // Get selected class info
    const selectedClassInfo = classes.find(c => c.id === selectedClass);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Ghi danh học viên</h1>
                        <p className="text-slate-500">Đăng ký học viên vào lớp học</p>
                    </div>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span>{success}</span>
                </div>
            )}

            {/* Center Selection for SUPER_ADMIN */}
            {isSuperAdmin() && centers.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-4">
                            <Building2 className="h-5 w-5 text-slate-400" />
                            <label className="text-sm font-medium text-slate-700">Trung tâm:</label>
                            <select
                                value={selectedCenter}
                                onChange={(e) => {
                                    setSelectedCenter(e.target.value);
                                    setSelectedStudents([]);
                                    setSelectedClass('');
                                }}
                                className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Student Selection */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                Chọn học viên
                            </CardTitle>
                            <Badge variant="secondary">
                                {selectedStudents.length} đã chọn
                            </Badge>
                        </div>
                        {/* Search */}
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm theo tên, email, SĐT..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {/* Select All */}
                        {filteredStudents.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAllStudents}
                                className="mt-2"
                            >
                                {filteredStudents.every(s => selectedStudents.includes(s.id))
                                    ? 'Bỏ chọn tất cả'
                                    : 'Chọn tất cả'}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Không tìm thấy học viên</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredStudents.map(student => (
                                    <StudentSelectItem
                                        key={student.id}
                                        student={student}
                                        selected={selectedStudents.includes(student.id)}
                                        onToggle={toggleStudent}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Class Selection */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-green-600" />
                            Chọn lớp học
                        </CardTitle>
                        {/* Search */}
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm theo tên lớp, khóa học..."
                                value={classSearch}
                                onChange={(e) => setClassSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : filteredClasses.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Không tìm thấy lớp học</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredClasses.map(classItem => (
                                    <ClassSelectItem
                                        key={classItem.id}
                                        classItem={classItem}
                                        selected={selectedClass === classItem.id}
                                        onClick={setSelectedClass}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Summary & Submit */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* 🔥 NEW: Info notice about draft invoice */}
                        <div className="flex items-center gap-3 text-sm">
                            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <p className="text-slate-600">
                                Hóa đơn sẽ được tạo ở trạng thái <span className="font-semibold text-blue-600">Draft</span> để xác nhận sau
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center gap-4">
                            {selectedClassInfo && selectedStudents.length > 0 && (
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Ước tính học phí:</p>
                                    <p className="text-lg font-bold text-slate-900">
                                        {formatCurrency((selectedClassInfo.courses?.tuition_fee || 0) * selectedStudents.length)}
                                    </p>
                                </div>
                            )}
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || selectedStudents.length === 0 || !selectedClass}
                                className="min-w-[150px]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Ghi danh ({selectedStudents.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default NewEnrollmentPage;

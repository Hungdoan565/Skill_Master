import { gooeyToast } from 'goey-toast';
/**
 * AdminNotificationsPage - Gửi thông báo hàng loạt cho admin
 * Cho phép lọc học viên theo khóa học, lớp, trạng thái học phí
 * và gửi thông báo với smart variables tự động điền
 */

// Payment status color map — Tailwind requires static class names (no interpolation)
const PAYMENT_STATUS_COLORS = {
    owing: 'border-red-500 bg-red-500 text-white shadow-sm shadow-red-200',
    paid: 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200',
    all: 'border-slate-500 bg-slate-500 text-white shadow-sm shadow-slate-200',
};

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    Bell,
    Mail,
    MessageSquare,
    Users,
    Send,
    AlertCircle,
    CheckCircle,
    Loader2,
    Filter,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square,
    Eye,
    FileText,
    Building2,
    GraduationCap,
    BookOpen,
    Wallet,
    RefreshCw,
    Info,
    X,
    History,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Notification templates với smart variables
const NOTIFICATION_TEMPLATES = [
    {
        id: 'payment_reminder',
        name: 'Nhắc nhở học phí',
        subject: 'Nhắc nhở học phí - {courseName}',
        content: `Kính gửi {studentName},

Trung tâm xin thông báo về tình hình học phí của bạn:

• Khóa học: {courseName}
• Lớp: {className}
• Tổng học phí: {totalFee}
• Đã thanh toán: {paidAmount}
• Còn lại: {remainingAmount}
• Hạn thanh toán: {dueDate}

Xin vui lòng thanh toán trước hạn để đảm bảo quyền lợi học tập.

Thông tin chuyển khoản:
- Ngân hàng: {bankName}
- Số tài khoản: {bankAccount}
- Chủ tài khoản: {accountHolder}
- Nội dung: HP {studentName} - {className}

Trân trọng,
{centerName}`,
        fields: [
            { key: 'dueDate', label: 'Hạn thanh toán', type: 'date' },
            { key: 'bankName', label: 'Ngân hàng', type: 'select', options: ['Vietcombank', 'Techcombank', 'BIDV', 'Agribank', 'MB Bank', 'VPBank', 'ACB', 'Sacombank', 'TPBank', 'Khác'] },
            { key: 'bankAccount', label: 'Số tài khoản', type: 'text', placeholder: 'VD: 1234567890' },
            { key: 'accountHolder', label: 'Chủ tài khoản', type: 'text', placeholder: 'VD: CONG TY ABC' },
        ],
        autoFields: ['studentName', 'courseName', 'className', 'totalFee', 'paidAmount', 'remainingAmount', 'centerName']
    },
    {
        id: 'class_reminder',
        name: 'Nhắc nhở buổi học',
        subject: 'Nhắc nhở buổi học - {className}',
        content: `Xin chào {studentName},

Nhắc bạn về buổi học sắp tới:
- Lớp: {className}
- Khóa học: {courseName}
- Giáo viên: {teacherName}
- Phòng học: {roomName}

Hãy chuẩn bị bài và đến đúng giờ nhé!

Trân trọng,
{centerName}`,
        fields: [],
        autoFields: ['studentName', 'className', 'courseName', 'teacherName', 'roomName', 'centerName']
    },
    {
        id: 'general_announcement',
        name: 'Thông báo chung',
        subject: 'Thông báo từ {centerName}',
        content: `Kính gửi {studentName},

{customContent}

Trân trọng,
{centerName}`,
        fields: [
            { key: 'customContent', label: 'Nội dung thông báo', type: 'textarea', placeholder: 'Nhập nội dung thông báo...' }
        ],
        autoFields: ['studentName', 'centerName']
    },
    {
        id: 'course_completion',
        name: 'Chúc mừng hoàn thành khóa học',
        subject: 'Chúc mừng hoàn thành khóa học - {courseName}',
        content: `Kính gửi {studentName},

Chúc mừng bạn đã hoàn thành khóa học {courseName}!

Thông tin khóa học:
- Lớp: {className}
- Giáo viên: {teacherName}

Cảm ơn bạn đã tin tưởng và đồng hành cùng chúng tôi. Chúc bạn thành công trên con đường học tập!

Trân trọng,
{centerName}`,
        fields: [],
        autoFields: ['studentName', 'courseName', 'className', 'teacherName', 'centerName']
    }
];

export default function AdminNotificationsPage() {
    const { session } = useAuth();

    const getAuthHeaders = useCallback(() => ({
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
    }), [session?.access_token]);

    // Data states
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Filter states
    const [filterType, setFilterType] = useState('course'); // 'course' | 'class' | 'all'
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [selectedClassIds, setSelectedClassIds] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState('owing'); // 'all' | 'owing' | 'paid'
    const [searchQuery, setSearchQuery] = useState('');

    // Notification states
    const [step, setStep] = useState(1); // 1: Chọn đối tượng, 2: Soạn thông báo, 3: Xem trước, 4: Kết quả
    const [notificationType, setNotificationType] = useState('email');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateFields, setTemplateFields] = useState({});
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    // Result states
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    // Tab & history states
    const [activeTab, setActiveTab] = useState('send'); // 'send' | 'history'
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [previewStudentIndex, setPreviewStudentIndex] = useState(0);

    // Expanded sections
    const [expandedCourses, setExpandedCourses] = useState(true);
    const [expandedClasses, setExpandedClasses] = useState(true);

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch(`${API_URL}/api/courses`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    setCourses(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetchCourses();
    }, [getAuthHeaders]);

    // Fetch classes
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await fetch(`${API_URL}/api/classes`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    setClasses(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
        };
        fetchClasses();
    }, [getAuthHeaders]);

    // Fetch students based on filters
    const fetchStudents = useCallback(async () => {
        setLoadingStudents(true);
        try {
            const params = new URLSearchParams();

            if (filterType === 'course' && selectedCourseIds.length > 0) {
                params.append('course_ids', selectedCourseIds.join(','));
            }
            if (filterType === 'class' && selectedClassIds.length > 0) {
                params.append('class_ids', selectedClassIds.join(','));
            }
            if (paymentStatus !== 'all') {
                params.append('payment_status', paymentStatus);
            }

            const response = await fetch(`${API_URL}/api/notifications/students?${params}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setStudents(data.data || []);
                // Auto-select all students using enrollment_id
                setSelectedStudentIds((data.data || []).map(s => s.enrollment_id));
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoadingStudents(false);
        }
    }, [filterType, selectedCourseIds, selectedClassIds, paymentStatus, getAuthHeaders]);

    // Filtered students based on search
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const query = searchQuery.toLowerCase();
        return students.filter(s =>
            s.full_name?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query) ||
            s.class_name?.toLowerCase().includes(query) ||
            s.course_name?.toLowerCase().includes(query)
        );
    }, [students, searchQuery]);

    // Selected students data
    const selectedStudents = useMemo(() => {
        return students.filter(s => selectedStudentIds.includes(s.enrollment_id));
    }, [students, selectedStudentIds]);

    // Current template
    const currentTemplate = useMemo(() =>
        NOTIFICATION_TEMPLATES.find(t => t.id === selectedTemplate),
        [selectedTemplate]
    );

    // Toggle course selection
    const toggleCourse = (courseId) => {
        setSelectedCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    // Toggle class selection
    const toggleClass = (classId) => {
        setSelectedClassIds(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    // Toggle student selection (by enrollment_id to handle duplicates)
    const toggleStudent = (enrollmentId) => {
        setSelectedStudentIds(prev =>
            prev.includes(enrollmentId)
                ? prev.filter(id => id !== enrollmentId)
                : [...prev, enrollmentId]
        );
    };

    // Select all students (by enrollment_id)
    const selectAllStudents = () => {
        setSelectedStudentIds(filteredStudents.map(s => s.enrollment_id));
    };

    // Deselect all students
    const deselectAllStudents = () => {
        setSelectedStudentIds([]);
    };

    // Handle template selection
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
        setTemplateFields({});
    };

    // Handle field change
    const handleFieldChange = (key, value) => {
        setTemplateFields(prev => ({ ...prev, [key]: value }));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    // Generate preview content for a student
    const generatePreviewContent = (student) => {
        if (!currentTemplate) return '';

        let content = currentTemplate.content;
        let subject = currentTemplate.subject;

        // Replace auto fields
        const autoReplacements = {
            '{studentName}': student.full_name || '',
            '{courseName}': student.course_name || '',
            '{className}': student.class_name || '',
            '{teacherName}': student.teacher_name || '',
            '{roomName}': student.room_name || '',
            '{centerName}': student.center_name || 'Trung tâm',
            '{totalFee}': formatCurrency(student.total_fee),
            '{paidAmount}': formatCurrency(student.paid_amount),
            '{remainingAmount}': formatCurrency(student.remaining_amount),
        };

        Object.entries(autoReplacements).forEach(([key, value]) => {
            content = content.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
            subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });

        // Replace custom fields
        currentTemplate.fields?.forEach(field => {
            const value = templateFields[field.key] || `[${field.label}]`;
            const formattedValue = field.type === 'date' && templateFields[field.key]
                ? new Date(templateFields[field.key]).toLocaleDateString('vi-VN')
                : value;
            content = content.replace(new RegExp(`\\{${field.key}\\}`, 'g'), formattedValue);
            subject = subject.replace(new RegExp(`\\{${field.key}\\}`, 'g'), formattedValue);
        });

        return { subject, content };
    };

    // Validate template fields
    const hasUnfilledRequiredFields = useMemo(() => {
        if (!currentTemplate) return false;
        return currentTemplate.fields.some(f => !templateFields[f.key]?.toString().trim());
    }, [currentTemplate, templateFields]);

    // Fetch notification history
    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const response = await fetch(`${API_URL}/api/notifications?limit=50&page=1`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data.data?.notifications || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [getAuthHeaders]);

    // Send notifications
    const handleSend = async () => {
        if (selectedStudentIds.length === 0) {
            gooeyToast.warning('Vui lòng chọn ít nhất một học viên');
            return;
        }
        if (!selectedTemplate) {
            gooeyToast.warning('Vui lòng chọn mẫu thông báo');
            return;
        }
        if (hasUnfilledRequiredFields) {
            gooeyToast.warning('Vui lòng điền đầy đủ thông tin bổ sung cho mẫu thông báo');
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const response = await fetch(`${API_URL}/api/notifications/send-bulk`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    student_ids: selectedStudentIds,
                    template_id: selectedTemplate,
                    template_fields: templateFields,
                    notification_type: notificationType
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    sent: data.sent || selectedStudentIds.length,
                    failed: data.failed || 0,
                    message: data.message || 'Gửi thông báo thành công!'
                });
                setStep(4);
            } else {
                setResult({
                    success: false,
                    message: data.message || 'Có lỗi xảy ra khi gửi thông báo'
                });
            }
        } catch (error) {
            console.error('Error sending notifications:', error);
            setResult({
                success: false,
                message: 'Có lỗi xảy ra khi gửi thông báo'
            });
        } finally {
            setSending(false);
        }
    };

    // Reset all
    const handleReset = () => {
        setStep(1);
        setSelectedCourseIds([]);
        setSelectedClassIds([]);
        setSelectedStudentIds([]);
        setSelectedTemplate('');
        setTemplateFields({});
        setResult(null);
        setStudents([]);
    };

    // Classes filtered by selected courses
    const filteredClasses = useMemo(() => {
        if (filterType !== 'course' || selectedCourseIds.length === 0) return classes;
        return classes.filter(c => selectedCourseIds.includes(c.courses?.id));
    }, [classes, filterType, selectedCourseIds]);

    // Courses with student count
    const coursesWithInfo = useMemo(() => {
        return courses.map(course => ({
            ...course,
            classCount: classes.filter(c => c.courses?.id === course.id).length
        }));
    }, [courses, classes]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                            <Bell className="w-6 h-6" />
                        </div>
                        Gửi thông báo hàng loạt
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Gửi thông báo in-app đến nhiều học viên cùng lúc với nội dung tự động cá nhân hóa
                    </p>
                </div>

                {step > 1 && (
                    <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                )}
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'send'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Send className="w-4 h-4" />
                    Gửi mới
                </button>
                <button
                    onClick={() => { setActiveTab('history'); fetchHistory(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'history'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <History className="w-4 h-4" />
                    Lịch sử gửi
                </button>
            </div>

            {/* Simulation notice */}
            {activeTab === 'send' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                    <span className="font-semibold">Lưu ý:</span> Hiện tại hệ thống chỉ gửi <span className="font-semibold">thông báo in-app</span>.
                    Tích hợp gửi Email/SMS thật sẽ được cập nhật trong phiên bản tiếp theo.
                </div>
            </div>
            )}

            {/* Progress Steps */}
            {activeTab === 'send' && (
            <div className="flex items-center justify-center gap-2">
                {[
                    { num: 1, label: 'Chọn đối tượng' },
                    { num: 2, label: 'Soạn thông báo' },
                    { num: 3, label: 'Xem trước' },
                    { num: 4, label: 'Hoàn thành' }
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                        <div className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${step >= s.num
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }
                        `}>
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                {step > s.num ? '✓' : s.num}
                            </span>
                            <span className="hidden sm:inline">{s.label}</span>
                        </div>
                        {i < 3 && (
                            <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-orange-500' : 'bg-slate-200'}`} />
                        )}
                    </div>
                ))}
            </div>
            )}

            {/* === SEND TAB === */}
            {activeTab === 'send' && (
            <>
            {/* Step 1: Chọn đối tượng */}
            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Filters */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filter Type */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-orange-500" />
                                Lọc theo
                            </h3>
                            <div className="flex gap-2">
                                {[
                                    { value: 'course', label: 'Khóa học', icon: BookOpen },
                                    { value: 'class', label: 'Lớp học', icon: GraduationCap },
                                    { value: 'all', label: 'Tất cả', icon: Users }
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => {
                                            setFilterType(type.value);
                                            setSelectedCourseIds([]);
                                            setSelectedClassIds([]);
                                        }}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                                            ${filterType === type.value
                                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }
                                        `}
                                    >
                                        <type.icon className="w-4 h-4" />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Status Filter */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-orange-500" />
                                Trạng thái học phí
                            </h3>
                            <div className="flex gap-2">
                                {[
                                    { value: 'owing', label: 'Còn nợ học phí' },
                                    { value: 'paid', label: 'Đã thanh toán đủ' },
                                    { value: 'all', label: 'Tất cả' }
                                ].map(status => (
                                    <button
                                        key={status.value}
                                        onClick={() => setPaymentStatus(status.value)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                                            ${paymentStatus === status.value
                                                ? PAYMENT_STATUS_COLORS[status.value]
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }
                                        `}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Course/Class Selection */}
                        {filterType === 'course' && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => setExpandedCourses(!expandedCourses)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
                                >
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-orange-500" />
                                        Chọn khóa học ({selectedCourseIds.length}/{courses.length})
                                    </h3>
                                    {expandedCourses ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {expandedCourses && (
                                    <div className="border-t border-slate-200 max-h-64 overflow-y-auto">
                                        {coursesWithInfo.map(course => (
                                            <div
                                                key={course.id}
                                                onClick={() => toggleCourse(course.id)}
                                                className={`
                                                    flex items-center gap-3 p-3 border-b border-slate-100 cursor-pointer
                                                    ${selectedCourseIds.includes(course.id) ? 'bg-orange-50' : 'hover:bg-slate-50'}
                                                `}
                                            >
                                                {selectedCourseIds.includes(course.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-orange-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{course.title}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {course.classCount} lớp • {formatCurrency(course.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {filterType === 'class' && (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => setExpandedClasses(!expandedClasses)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
                                >
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-orange-500" />
                                        Chọn lớp học ({selectedClassIds.length}/{classes.length})
                                    </h3>
                                    {expandedClasses ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {expandedClasses && (
                                    <div className="border-t border-slate-200 max-h-64 overflow-y-auto">
                                        {classes.map(cls => (
                                            <div
                                                key={cls.id}
                                                onClick={() => toggleClass(cls.id)}
                                                className={`
                                                    flex items-center gap-3 p-3 border-b border-slate-100 cursor-pointer
                                                    ${selectedClassIds.includes(cls.id) ? 'bg-orange-50' : 'hover:bg-slate-50'}
                                                `}
                                            >
                                                {selectedClassIds.includes(cls.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-orange-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-400" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{cls.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {cls.courses?.title} • {cls.enrolled_count || 0} học viên
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fetch Students Button */}
                        <Button
                            onClick={fetchStudents}
                            disabled={loadingStudents || (filterType === 'course' && selectedCourseIds.length === 0) || (filterType === 'class' && selectedClassIds.length === 0)}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        >
                            {loadingStudents ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4 mr-2" />
                            )}
                            Tìm học viên phù hợp
                        </Button>
                    </div>

                    {/* Right: Student List */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    Học viên ({selectedStudentIds.length}/{students.length})
                                </h3>
                                {students.length > 0 && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={selectAllStudents}
                                            className="text-xs text-orange-600 hover:text-orange-800"
                                        >
                                            Chọn tất cả
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            onClick={deselectAllStudents}
                                            className="text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            Bỏ chọn
                                        </button>
                                    </div>
                                )}
                            </div>
                            {students.length > 0 && (
                                <Input
                                    placeholder="Tìm kiếm học viên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9"
                                />
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {loadingStudents ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                </div>
                            ) : students.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                    <Users className="w-12 h-12 mb-2 text-slate-300" />
                                    <p className="text-sm">Chọn bộ lọc và nhấn "Tìm học viên"</p>
                                </div>
                            ) : (
                                filteredStudents.map(student => (
                                    <div
                                        key={student.enrollment_id}
                                        onClick={() => toggleStudent(student.enrollment_id)}
                                        className={`
                                            flex items-start gap-3 p-3 border-b border-slate-100 cursor-pointer
                                            ${selectedStudentIds.includes(student.enrollment_id) ? 'bg-orange-50' : 'hover:bg-slate-50'}
                                        `}
                                    >
                                        {selectedStudentIds.includes(student.enrollment_id) ? (
                                            <CheckSquare className="w-5 h-5 text-orange-600 mt-0.5" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400 mt-0.5" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
                                            <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                            <p className="text-xs text-slate-400">{student.class_name}</p>
                                            {student.remaining_amount > 0 && (
                                                <p className="text-xs text-red-600 font-medium">
                                                    Nợ: {formatCurrency(student.remaining_amount)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {students.length > 0 && (
                            <div className="p-4 border-t border-slate-200">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={selectedStudentIds.length === 0}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
                                >
                                    Tiếp tục ({selectedStudentIds.length} học viên)
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Soạn thông báo */}
            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Template & Fields */}
                    <div className="space-y-4">
                        {/* Notification Type */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900 mb-3">Hình thức gửi</h3>
                            <div className="flex gap-3">
                                {[
                                    { value: 'email', label: 'Email', icon: Mail },
                                    { value: 'sms', label: 'SMS', icon: MessageSquare },
                                    { value: 'both', label: 'Cả hai', icon: Bell }
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => setNotificationType(type.value)}
                                        className={`
                                            flex items-center gap-2 px-4 py-3 rounded-xl border-2 flex-1 transition-all
                                            ${notificationType === type.value
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <type.icon className={`w-5 h-5 ${notificationType === type.value ? 'text-orange-600' : 'text-slate-400'}`} />
                                        <span className={`font-medium ${notificationType === type.value ? 'text-orange-900' : 'text-slate-700'}`}>
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Template Selection */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-orange-500" />
                                Mẫu thông báo
                            </h3>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => handleTemplateSelect(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            >
                                <option value="">-- Chọn mẫu thông báo --</option>
                                {NOTIFICATION_TEMPLATES.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Template Fields */}
                        {currentTemplate && currentTemplate.fields.length > 0 && (
                            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                                <h3 className="font-semibold text-orange-800 mb-3">
                                    📝 Điền thông tin bổ sung
                                </h3>
                                <div className="space-y-3">
                                    {currentTemplate.fields.map(field => (
                                        <div key={field.key}>
                                            <label className="text-sm font-medium text-slate-700 mb-1 block">
                                                {field.label}
                                            </label>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={templateFields[field.key] || ''}
                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                >
                                                    <option value="">-- Chọn --</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'textarea' ? (
                                                <textarea
                                                    value={templateFields[field.key] || ''}
                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    rows={4}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                                                />
                                            ) : field.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    value={templateFields[field.key] || ''}
                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={templateFields[field.key] || ''}
                                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Auto Fields Info */}
                        {currentTemplate && (
                            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Thông tin tự động điền
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentTemplate.autoFields.map(field => {
                                        const FIELD_LABELS = {
                                            studentName: 'Tên học viên',
                                            courseName: 'Tên khóa học',
                                            className: 'Tên lớp',
                                            teacherName: 'Giáo viên',
                                            roomName: 'Phòng học',
                                            centerName: 'Trung tâm',
                                            totalFee: 'Tổng học phí',
                                            paidAmount: 'Đã thanh toán',
                                            remainingAmount: 'Còn nợ'
                                        };
                                        return (
                                        <span
                                            key={field}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                            {FIELD_LABELS[field] || field}
                                        </span>
                                    );})}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Preview */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-orange-500" />
                                    Xem trước nội dung
                                </h3>
                                {selectedStudents.length > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPreviewStudentIndex(i => Math.max(0, i - 1))}
                                            disabled={previewStudentIndex === 0}
                                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs text-slate-500 tabular-nums">
                                            {previewStudentIndex + 1}/{selectedStudents.length}
                                        </span>
                                        <button
                                            onClick={() => setPreviewStudentIndex(i => Math.min(selectedStudents.length - 1, i + 1))}
                                            disabled={previewStudentIndex >= selectedStudents.length - 1}
                                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {selectedStudents.length > 0 && currentTemplate && (
                                <p className="text-sm text-slate-500 mt-1">
                                    Xem cho: <span className="font-medium text-slate-700">{selectedStudents[previewStudentIndex]?.full_name}</span>
                                </p>
                            )}
                        </div>
                        <div className="p-4">
                            {!currentTemplate ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <FileText className="w-12 h-12 mb-2" />
                                    <p>Chọn mẫu thông báo để xem trước</p>
                                </div>
                            ) : selectedStudents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                                    <AlertCircle className="w-12 h-12 mb-2" />
                                    <p>Không có học viên nào được chọn</p>
                                    <p className="text-xs mt-1">Vui lòng quay lại bước 1 và chọn học viên</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Tiêu đề:</label>
                                        <p className="font-semibold text-slate-900">
                                            {generatePreviewContent(selectedStudents[previewStudentIndex] || selectedStudents[0]).subject}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Nội dung:</label>
                                        <div className="mt-1 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                                            {generatePreviewContent(selectedStudents[previewStudentIndex] || selectedStudents[0]).content}
                                        </div>
                                    </div>
                                    {hasUnfilledRequiredFields && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                            <AlertCircle className="w-4 h-4" />
                                            Vui lòng điền đầy đủ thông tin bổ sung trước khi gửi
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-200 flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                Quay lại
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!selectedTemplate}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            >
                                Xem trước & Gửi
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Xác nhận & Gửi */}
            {step === 3 && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-900 text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Xác nhận gửi thông báo
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Số người nhận</p>
                                    <p className="text-2xl font-bold text-slate-900">{selectedStudentIds.length}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Hình thức</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {notificationType === 'email' ? 'Email' : notificationType === 'sms' ? 'SMS' : 'Email & SMS'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500 mb-2">Mẫu thông báo</p>
                                <p className="font-semibold text-slate-900">{currentTemplate?.name}</p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-800">Lưu ý</p>
                                        <p className="text-sm text-amber-700">
                                            Thông báo sẽ được gửi đến {selectedStudentIds.length} học viên.
                                            Mỗi email/SMS sẽ được cá nhân hóa với thông tin riêng của từng học viên.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                                Quay lại
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Gửi {selectedStudentIds.length} thông báo
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Kết quả */}
            {step === 4 && result && (
                <div className="max-w-lg mx-auto">
                    <div className={`
                        bg-white rounded-xl border-2 p-8 text-center
                        ${result.success ? 'border-green-200' : 'border-red-200'}
                    `}>
                        {result.success ? (
                            <>
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-green-800 mb-2">
                                    Gửi thông báo thành công!
                                </h3>
                                <p className="text-slate-600 mb-4">
                                    Đã gửi {result.sent} thông báo đến học viên
                                    {result.failed > 0 && ` (${result.failed} thất bại)`}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-red-800 mb-2">
                                    Có lỗi xảy ra
                                </h3>
                                <p className="text-slate-600 mb-4">{result.message}</p>
                            </>
                        )}

                        <Button
                            onClick={handleReset}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                        >
                            Gửi thông báo mới
                        </Button>
                    </div>
                </div>
            )}
            </>
            )}

            {/* === HISTORY TAB === */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <History className="w-4 h-4 text-orange-500" />
                            Thông báo đã gửi gần đây
                        </h3>
                        <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
                            <RefreshCw className={`w-3 h-3 mr-1 ${loadingHistory ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Bell className="w-12 h-12 mb-2" />
                                <p className="text-sm">Chưa có thông báo nào được gửi</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                                        item.read_at ? 'bg-slate-100' : 'bg-orange-100'
                                    }`}>
                                        <Bell className={`w-4 h-4 ${
                                            item.read_at ? 'text-slate-400' : 'text-orange-500'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 text-sm truncate">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs text-slate-400">
                                                {new Date(item.created_at).toLocaleString('vi-VN')}
                                            </span>
                                            {item.read_at && (
                                                <span className="text-xs text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Đã đọc
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

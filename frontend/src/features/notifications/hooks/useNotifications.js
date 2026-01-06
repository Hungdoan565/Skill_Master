/**
 * useNotifications Hook
 * Manages notification sending logic - fetching students, templates, and sending
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useNotifications() {
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
    const [filterType, setFilterType] = useState('course');
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [selectedClassIds, setSelectedClassIds] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState('owing');
    const [searchQuery, setSearchQuery] = useState('');

    // Notification states
    const [notificationType, setNotificationType] = useState('email');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateFields, setTemplateFields] = useState({});
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    // Result states
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    // Fetch courses on mount
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

    // Fetch classes on mount
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

    // Toggle functions
    const toggleCourse = (courseId) => {
        setSelectedCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const toggleClass = (classId) => {
        setSelectedClassIds(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const toggleStudent = (enrollmentId) => {
        setSelectedStudentIds(prev =>
            prev.includes(enrollmentId)
                ? prev.filter(id => id !== enrollmentId)
                : [...prev, enrollmentId]
        );
    };

    const selectAllStudents = () => {
        setSelectedStudentIds(filteredStudents.map(s => s.enrollment_id));
    };

    const deselectAllStudents = () => {
        setSelectedStudentIds([]);
    };

    // Template handlers
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
        setTemplateFields({});
    };

    const handleFieldChange = (key, value) => {
        setTemplateFields(prev => ({ ...prev, [key]: value }));
    };

    // Send notifications
    const handleSend = async () => {
        if (selectedStudentIds.length === 0) {
            return { success: false, message: 'Vui lòng chọn ít nhất một học viên' };
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
                const res = {
                    success: true,
                    sent: data.sent || selectedStudentIds.length,
                    failed: data.failed || 0,
                    message: data.message || 'Gửi thông báo thành công!'
                };
                setResult(res);
                return res;
            } else {
                const res = {
                    success: false,
                    message: data.message || 'Có lỗi xảy ra khi gửi thông báo'
                };
                setResult(res);
                return res;
            }
        } catch (error) {
            console.error('Error sending notifications:', error);
            const res = {
                success: false,
                message: 'Có lỗi xảy ra khi gửi thông báo'
            };
            setResult(res);
            return res;
        } finally {
            setSending(false);
        }
    };

    // Reset all
    const reset = () => {
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

    // Courses with class count
    const coursesWithInfo = useMemo(() => {
        return courses.map(course => ({
            ...course,
            classCount: classes.filter(c => c.courses?.id === course.id).length
        }));
    }, [courses, classes]);

    return {
        // Data
        courses,
        classes,
        students,
        loading,
        loadingStudents,
        coursesWithInfo,
        filteredClasses,
        filteredStudents,
        selectedStudents,

        // Filters
        filterType,
        setFilterType,
        selectedCourseIds,
        selectedClassIds,
        paymentStatus,
        setPaymentStatus,
        searchQuery,
        setSearchQuery,

        // Notification
        notificationType,
        setNotificationType,
        selectedTemplate,
        templateFields,
        selectedStudentIds,

        // Result
        sending,
        result,

        // Actions
        fetchStudents,
        toggleCourse,
        toggleClass,
        toggleStudent,
        selectAllStudents,
        deselectAllStudents,
        handleTemplateSelect,
        handleFieldChange,
        handleSend,
        reset,
    };
}

export default useNotifications;

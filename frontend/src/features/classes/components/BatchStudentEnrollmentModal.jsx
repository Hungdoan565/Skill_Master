/**
 * BatchStudentEnrollmentModal Component
 * Enhanced interface for batch enrollment of students to a class
 * Features: Search, filter by course, bulk select, preview
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  X,
  Search,
  Users,
  UserPlus,
  Filter,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Mail,
  Phone,
  Building,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function BatchStudentEnrollmentModal({
  show,
  onClose,
  classId,
  classData,
  onSuccess
}) {
  const { session } = useAuth();
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });
  
  const currentStudentIds = [];
  const courseId = classData?.course_id;
  const centerId = classData?.center_id;
  const className = classData?.name || classData?.class_name;
  const onEnrollSuccess = onSuccess;
  const isOpen = show;
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [result, setResult] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    showEnrolledOnly: false,
    showNotEnrolled: true,
    courseFilter: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Courses for filter
  const [courses, setCourses] = useState([]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      // Fetch students with reasonable limit (reduced from 500 to 100)
      const response = await fetch(`${API_URL}/api/admin/students?limit=100`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      setStudents(data.data || []);
      
      // Extract unique courses from students' enrollments for filter
      const uniqueCourses = new Map();
      data.data?.forEach(student => {
        student.enrollments?.forEach(enrollment => {
          if (enrollment.course_id && enrollment.course_name) {
            uniqueCourses.set(enrollment.course_id, enrollment.course_name);
          }
        });
      });
      setCourses(Array.from(uniqueCourses, ([id, name]) => ({ id, name })));
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [isOpen, getAuthHeaders]);

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedIds([]);
      setResult(null);
      setSearchQuery('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    let result = students;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.full_name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      );
    }

    // Filter by enrollment status
    if (filters.showNotEnrolled && !filters.showEnrolledOnly) {
      result = result.filter(s => !currentStudentIds.includes(s.id));
    } else if (filters.showEnrolledOnly && !filters.showNotEnrolled) {
      result = result.filter(s => currentStudentIds.includes(s.id));
    }

    // Filter by course
    if (filters.courseFilter) {
      result = result.filter(s => 
        s.enrollments?.some(e => e.course_id === filters.courseFilter)
      );
    }

    return result;
  }, [students, searchQuery, filters, currentStudentIds]);

  // Enrollment check for display
  const isEnrolled = useCallback((studentId) => {
    return currentStudentIds.includes(studentId);
  }, [currentStudentIds]);

  // Selection handlers
  const toggleSelect = useCallback((studentId) => {
    setSelectedIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    const selectableIds = filteredStudents
      .filter(s => !isEnrolled(s.id))
      .map(s => s.id);
    
    if (selectableIds.every(id => selectedIds.includes(id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableIds);
    }
  }, [filteredStudents, selectedIds, isEnrolled]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Enroll selected students
  const handleEnroll = async () => {
    if (selectedIds.length === 0) return;
    
    setEnrolling(true);
    setResult(null);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Enroll each student
    for (const studentId of selectedIds) {
      try {
        const response = await fetch(`${API_URL}/api/admin/classes/${classId}/students`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ student_id: studentId })
        });

        if (!response.ok) {
          const error = await response.json();
          results.failed++;
          const student = students.find(s => s.id === studentId);
          results.errors.push({
            student: student?.full_name || studentId,
            error: error.message || 'Lỗi không xác định'
          });
        } else {
          results.success++;
        }
      } catch (error) {
        results.failed++;
        const student = students.find(s => s.id === studentId);
        results.errors.push({
          student: student?.full_name || studentId,
          error: error.message
        });
      }
    }

    setResult(results);
    setEnrolling(false);
    
    if (results.success > 0) {
      // Clear selection of successfully enrolled students
      setSelectedIds(prev => prev.filter(id => 
        results.errors.some(e => students.find(s => s.full_name === e.student)?.id === id)
      ));
      onEnrollSuccess?.();
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    setResult(null);
    setSearchQuery('');
    setFilters({
      showEnrolledOnly: false,
      showNotEnrolled: true,
      courseFilter: ''
    });
    onClose();
  };

  // Selection state
  const selectableCount = filteredStudents.filter(s => !isEnrolled(s.id)).length;
  const allSelected = selectableCount > 0 && selectedIds.length === selectableCount;
  const someSelected = selectedIds.length > 0 && !allSelected;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-teal-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Thêm học viên hàng loạt
              </h2>
              <p className="text-sm text-white/80">
                Lớp: {className}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, email, SĐT..."
                className="pl-10 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-emerald-50 border-emerald-300' : ''}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Bộ lọc
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200">
              {/* Enrollment Status */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showNotEnrolled}
                    onChange={(e) => setFilters(prev => ({ ...prev, showNotEnrolled: e.target.checked }))}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Chưa trong lớp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showEnrolledOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, showEnrolledOnly: e.target.checked }))}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Đã trong lớp</span>
                </label>
              </div>

              {/* Course Filter */}
              {courses.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Khóa học:</span>
                  <select
                    value={filters.courseFilter}
                    onChange={(e) => setFilters(prev => ({ ...prev, courseFilter: e.target.value }))}
                    className="h-8 px-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  >
                    <option value="">Tất cả</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Selection Info */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">
                  Đã chọn {selectedIds.length} học viên
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result Banner */}
        {result && (
          <div className={`p-4 border-b ${result.success > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {result.success > 0 ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h4 className={`font-semibold ${result.success > 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  {result.success > 0 
                    ? `Đã thêm ${result.success} học viên thành công`
                    : 'Không thể thêm học viên'
                  }
                </h4>
                {result.failed > 0 && (
                  <p className="text-sm text-red-700 mt-1">
                    {result.failed} học viên thất bại
                    {result.errors.length > 0 && (
                      <span className="block mt-1">
                        {result.errors.slice(0, 3).map((e, i) => (
                          <span key={i} className="block">• {e.student}: {e.error}</span>
                        ))}
                        {result.errors.length > 3 && (
                          <span className="block italic">... và {result.errors.length - 3} lỗi khác</span>
                        )}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Không tìm thấy học viên nào</p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSearchQuery('')}
                >
                  Xóa tìm kiếm
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg sticky top-0">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                  disabled={selectableCount === 0}
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : someSelected ? (
                    <MinusSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                  <span>Chọn tất cả ({selectableCount} học viên có thể thêm)</span>
                </button>
              </div>

              {/* Student Items */}
              {filteredStudents.map(student => (
                <StudentItem
                  key={student.id}
                  student={student}
                  isSelected={selectedIds.includes(student.id)}
                  isEnrolled={isEnrolled(student.id)}
                  onToggleSelect={() => toggleSelect(student.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <p className="text-sm text-slate-500">
            {filteredStudents.length} học viên • {selectableCount} có thể thêm
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={selectedIds.length === 0 || enrolling}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {enrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm {selectedIds.length} học viên
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Student Item Component
function StudentItem({ student, isSelected, isEnrolled, onToggleSelect }) {
  return (
    <div 
      className={`
        flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer
        ${isEnrolled 
          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' 
          : isSelected 
            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }
      `}
      onClick={() => !isEnrolled && onToggleSelect()}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {isEnrolled ? (
          <CheckCircle className="w-5 h-5 text-slate-400" />
        ) : isSelected ? (
          <CheckSquare className="w-5 h-5 text-emerald-600" />
        ) : (
          <Square className="w-5 h-5 text-slate-400" />
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
        {student.full_name?.charAt(0) || '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
          {isEnrolled && (
            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
              Đã trong lớp
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
          {student.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="w-3.5 h-3.5" />
              {student.email}
            </span>
          )}
          {student.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {student.phone}
            </span>
          )}
        </div>
      </div>

      {/* Enrollment Count */}
      {student.enrollments?.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-sm text-slate-600">
          <GraduationCap className="w-4 h-4" />
          <span>{student.enrollments.length} lớp</span>
        </div>
      )}
    </div>
  );
}

export default BatchStudentEnrollmentModal;

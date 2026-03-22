import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, GraduationCap, Upload, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gooeyToast } from 'goey-toast';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { exportStudentsToExcel } from '../utils/export-students-excel';
import { API_URL, ENROLLMENT_STATE_OPTIONS } from '../utils';
import { useStudents } from '../hooks';
import {
  StudentBulkActionsBar,
  StudentFilters,
  StudentImportModal,
  StudentRosterView,
  StudentsTable,
  PromoteModal,
  StudentDetailModal,
  EditStudentModal,
} from '../components';

const DEFAULT_FILTERS = {
  status: '',
  centerId: '',
  courseId: '',
  classId: '',
  enrollmentState: 'all',
};

export function StudentsPage() {
  const navigate = useNavigate();
  const { profile, isSuperAdmin } = useAuth();

  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [rosterStudents, setRosterStudents] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [promoteModal, setPromoteModal] = useState({ isOpen: false, student: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, student: null, data: null, loading: false });
  const [editModal, setEditModal] = useState({ isOpen: false, student: null, submitting: false });
  const [showImportModal, setShowImportModal] = useState(false);

  const {
    students,
    loading,
    error,
    pagination,
    fetchStudents,
    fetchStudentDetail,
    updateStudent,
    promoteStudent,
    bulkUpdateStudentsStatus,
    checkBulkDeleteEligibility,
    bulkDeleteStudents,
    lockUser,
    unlockUser,
    resetUserPassword,
  } = useStudents();

  const centerName = profile?.centers?.name || 'Skill Master';

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }

    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      const headers = await getAuthHeaders();

      const [centersRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/centers`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/courses?status=active`, { headers }).catch(() => ({ data: { data: [] } })),
      ]);

      setCenters((centersRes.data?.data || []).map((center) => ({ value: center.id, label: center.name })));
      setCourses((coursesRes.data?.data || []).map((course) => ({
        value: course.id,
        label: course.title || course.name,
        raw: course,
      })));
    } catch (fetchError) {
      console.error('Error fetching student filter options:', fetchError);
      gooeyToast.error('Không thể tải dữ liệu bộ lọc học viên');
    } finally {
      setOptionsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchClassOptions = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ minimal: 'true', limit: '100' });

      if (filters.centerId) params.append('centerId', filters.centerId);
      if (filters.courseId) params.append('course_id', filters.courseId);

      const response = await axios.get(`${API_URL}/api/classes?${params}`, { headers });
      setClasses((response.data?.data || []).map((item) => ({
        ...item,
        value: item.id,
        label: item.name,
      })));
    } catch (fetchError) {
      console.error('Error fetching classes for student workspace:', fetchError);
      setClasses([]);
    }
  }, [filters.centerId, filters.courseId, getAuthHeaders]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchClassOptions();
  }, [fetchClassOptions]);

  useEffect(() => {
    setSelectedRows([]);
  }, [students, currentPage, pageSize, viewMode]);

  useEffect(() => {
    if (viewMode !== 'list') return;

    fetchStudents({
      status: filters.status,
      search: debouncedSearch,
      centerId: filters.centerId,
      classId: filters.classId,
      courseId: filters.courseId,
      enrollmentState: filters.enrollmentState,
      page: currentPage,
      limit: pageSize,
    }).catch((fetchError) => {
      console.error('Error fetching students list:', fetchError);
    });
  }, [viewMode, filters, debouncedSearch, currentPage, pageSize, fetchStudents]);

  useEffect(() => {
    const fetchRoster = async () => {
      if (viewMode !== 'roster' || !filters.classId) {
        setRosterStudents([]);
        return;
      }

      try {
        setRosterLoading(true);
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/api/admin/classes/${filters.classId}/students`, { headers });
        setRosterStudents(response.data?.data || []);
      } catch (fetchError) {
        console.error('Error fetching roster students:', fetchError);
        gooeyToast.error('Không thể tải roster học viên');
        setRosterStudents([]);
      } finally {
        setRosterLoading(false);
      }
    };

    fetchRoster();
  }, [viewMode, filters.classId, getAuthHeaders]);

  const updateFilter = useCallback((key, value) => {
    setCurrentPage(1);
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'courseId') next.classId = '';
      if (key === 'centerId') next.classId = '';
      return next;
    });
  }, []);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedRows.includes(student.id)),
    [students, selectedRows]
  );

  const handleViewDetails = useCallback(async (student) => {
    setDetailModal({ isOpen: true, student, data: null, loading: true });

    try {
      const data = await fetchStudentDetail(student.id);
      setDetailModal((prev) => ({ ...prev, data, loading: false }));
    } catch (fetchError) {
      console.error('Error fetching student detail:', fetchError);
      setDetailModal((prev) => ({ ...prev, loading: false }));
      gooeyToast.error('Không thể tải chi tiết học viên');
    }
  }, [fetchStudentDetail]);

  const handleEditSubmit = async (studentId, data) => {
    setEditModal((prev) => ({ ...prev, submitting: true }));

    try {
      await updateStudent(studentId, data);
      setEditModal({ isOpen: false, student: null, submitting: false });
      gooeyToast.success('Cập nhật thông tin học viên thành công!');
      await fetchStudents({
        status: filters.status,
        search: debouncedSearch,
        centerId: filters.centerId,
        classId: filters.classId,
        courseId: filters.courseId,
        enrollmentState: filters.enrollmentState,
        page: currentPage,
        limit: pageSize,
      });
    } catch (updateError) {
      console.error('Error updating student:', updateError);
      gooeyToast.error(updateError.message || 'Có lỗi xảy ra khi cập nhật');
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const refreshCurrentList = useCallback(async () => {
    await fetchStudents({
      status: filters.status,
      search: debouncedSearch,
      centerId: filters.centerId,
      classId: filters.classId,
      courseId: filters.courseId,
      enrollmentState: filters.enrollmentState,
      page: currentPage,
      limit: pageSize,
    });
  }, [fetchStudents, filters, debouncedSearch, currentPage, pageSize]);

  // Lock user handler (SUPER_ADMIN)
  const handleLockUser = useCallback(async (userId) => {
    try {
      await lockUser(userId);
      gooeyToast.success('Đã khóa tài khoản');
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể khóa tài khoản');
    }
  }, [lockUser]);

  // Unlock user handler (SUPER_ADMIN)
  const handleUnlockUser = useCallback(async (userId) => {
    try {
      await unlockUser(userId);
      gooeyToast.success('Đã mở khóa tài khoản');
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể mở khóa tài khoản');
    }
  }, [unlockUser]);

  // Reset password handler (SUPER_ADMIN)
  const handleResetPassword = useCallback(async (userId) => {
    try {
      await resetUserPassword(userId);
      gooeyToast.success('Đã gửi link đặt lại mật khẩu');
    } catch (error) {
      gooeyToast.error(error.message || 'Không thể gửi link đặt lại mật khẩu');
    }
  }, [resetUserPassword]);

  const handleBulkStatus = useCallback(async (status) => {
    if (selectedRows.length === 0) return;

    const confirmed = window.confirm(
      status === 'inactive'
        ? `Vô hiệu hóa ${selectedRows.length} học viên đã chọn?`
        : `Khôi phục ${selectedRows.length} học viên đã chọn?`
    );

    if (!confirmed) return;

    try {
      setBulkBusy(true);
      const result = await bulkUpdateStudentsStatus(selectedRows, status);
      const blockedCount = result.blockedStudentIds?.length || 0;

      if (blockedCount > 0) {
        gooeyToast.warning(`Đã xử lý ${result.data?.length || 0} học viên, còn ${blockedCount} học viên bị chặn do đang có lớp active`);
      } else {
        gooeyToast.success(result.message || 'Đã cập nhật trạng thái hàng loạt');
      }

      setSelectedRows([]);
      await refreshCurrentList();
    } catch (bulkError) {
      console.error('Error bulk updating students:', bulkError);
      gooeyToast.error(bulkError.response?.data?.message || bulkError.message || 'Không thể cập nhật hàng loạt');
    } finally {
      setBulkBusy(false);
    }
  }, [bulkUpdateStudentsStatus, refreshCurrentList, selectedRows]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.length === 0) return;

    try {
      setBulkBusy(true);
      const eligibility = await checkBulkDeleteEligibility(selectedRows);

      if (eligibility.allowed.length === 0) {
        gooeyToast.warning('Không có học viên nào đủ điều kiện xóa. Các học viên đã chọn đang có dữ liệu nghiệp vụ liên quan.');
        return;
      }

      const confirmed = window.confirm(
        `Xóa có điều kiện ${eligibility.allowed.length} học viên đủ điều kiện? ${eligibility.blocked.length > 0 ? `(${eligibility.blocked.length} học viên sẽ bị giữ lại)` : ''}`
      );
      if (!confirmed) return;

      const result = await bulkDeleteStudents(eligibility.allowed.map((student) => student.id));

      if (eligibility.blocked.length > 0) {
        gooeyToast.warning(`${result.data?.length || 0} học viên đã bị vô hiệu hóa. ${eligibility.blocked.length} học viên bị giữ lại do đã phát sinh nghiệp vụ.`);
      } else {
        gooeyToast.success(result.message || 'Đã xóa có điều kiện thành công');
      }

      setSelectedRows([]);
      await refreshCurrentList();
    } catch (bulkError) {
      console.error('Error bulk deleting students:', bulkError);
      gooeyToast.error(bulkError.response?.data?.message || bulkError.message || 'Không thể xóa hàng loạt');
    } finally {
      setBulkBusy(false);
    }
  }, [bulkDeleteStudents, checkBulkDeleteEligibility, refreshCurrentList, selectedRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Học viên</h1>
          <p className="text-muted-foreground">
            Workspace cho tìm kiếm, roster theo lớp/khóa và vận hành học viên ở quy mô lớn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportStudentsToExcel(selectedStudents.length > 0 ? selectedStudents : students, centerName)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4" /> Xuất Excel
          </button>

          <Link to="/admin/enrollments/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UserPlus className="mr-2 h-4 w-4" /> Ghi danh
            </Button>
          </Link>

          <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800" onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>

          <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-2">
            <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {viewMode === 'list' ? pagination.total : rosterStudents.length} học viên
            </span>
          </div>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3">
          <StudentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={filters.status}
            onStatusChange={(value) => updateFilter('status', value)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            centerFilter={filters.centerId}
            onCenterChange={(value) => updateFilter('centerId', value)}
            centerOptions={centers}
            courseFilter={filters.courseId}
            onCourseChange={(value) => updateFilter('courseId', value)}
            courseOptions={courses}
            classFilter={filters.classId}
            onClassChange={(value) => updateFilter('classId', value)}
            classOptions={classes.map((item) => ({ value: item.id, label: item.name }))}
            enrollmentState={filters.enrollmentState}
            onEnrollmentStateChange={(value) => updateFilter('enrollmentState', value)}
            filteredCount={viewMode === 'list' ? students.length : rosterStudents.length}
            totalCount={viewMode === 'list' ? pagination.total : classes.length}
          />
        </CardHeader>

        <CardContent>
          {viewMode === 'list' ? (
            <>
              <StudentBulkActionsBar
                selectedCount={selectedRows.length}
                busy={bulkBusy}
                onExport={() => exportStudentsToExcel(selectedStudents, centerName)}
                onActivate={() => handleBulkStatus('active')}
                onDeactivate={() => handleBulkStatus('inactive')}
                onDelete={handleBulkDelete}
              />

              <StudentsTable
                students={students}
                loading={loading}
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                currentPage={pagination.page || currentPage}
                pageSize={pagination.limit || pageSize}
                totalItems={pagination.total || 0}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                onViewDetails={handleViewDetails}
                onEdit={(student) => setEditModal({ isOpen: true, student, submitting: false })}
                onPromote={(student) => setPromoteModal({ isOpen: true, student })}
                onLockUser={handleLockUser}
                onUnlockUser={handleUnlockUser}
                onResetPassword={handleResetPassword}
                isSuperAdmin={isSuperAdmin?.() || false}
              />

              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}
            </>
          ) : (
            <StudentRosterView
              classes={classes}
              courses={courses.map((item) => item.raw || item)}
              selectedClassId={filters.classId}
              selectedCourseId={filters.courseId}
              rosterStudents={rosterStudents}
              loading={rosterLoading || optionsLoading}
              onSelectClass={(classId) => updateFilter('classId', classId)}
              onViewStudent={handleViewDetails}
              onOpenClass={(classId) => navigate(`/admin/classes/${classId}`)}
            />
          )}
        </CardContent>
      </Card>

      <StudentDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, student: null, data: null, loading: false })}
        student={detailModal.student}
        detailData={detailModal.data}
        loading={detailModal.loading}
      />

      <EditStudentModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, student: null, submitting: false })}
        student={editModal.student}
        onSubmit={handleEditSubmit}
        submitting={editModal.submitting}
      />

      <PromoteModal
        isOpen={promoteModal.isOpen}
        onClose={() => setPromoteModal({ isOpen: false, student: null })}
        student={promoteModal.student}
        onConfirm={async (studentId, roleCode) => {
          await promoteStudent(studentId, roleCode);
          setPromoteModal({ isOpen: false, student: null });
          await refreshCurrentList();
        }}
      />

      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={async (count) => {
          gooeyToast.success(`Đã import ${count} học viên thành công!`);
          await refreshCurrentList();
        }}
      />
    </div>
  );
}

export default StudentsPage;

/**
 * ClassDetailPage - Main Container Component
 * Orchestrates all sub-components and hooks
 */

import { useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft, Users, Calendar, GraduationCap, UserPlus, Mail, FileText, Copy, TrendingUp, BarChart3, FolderOpen, Keyboard } from 'lucide-react';

// Components
import {
  ClassHeader,
  TabButton,
  Toast,
  StudentsTab,
  ScheduleTab,
  GradesTab,
  AddStudentModal,
  DeleteConfirmModal,
  BulkRemoveStudentsModal,
  PaymentModal,
  AttendanceModal,
  // Phase 1.3: Bulk Sessions
  BulkSessionsModal,
  // Phase 2 Components
  StudentTransferModal,
  ClassReportModal,
  // Phase 2.3: Student Performance
  StudentPerformanceTab,
  // Phase 2.4: Grade Analytics
  GradeAnalyticsTab,
  // Phase 2.5: Documents
  ClassDocumentsTab,
  // Keyboard shortcuts
  KeyboardShortcutsModal
} from '../components';
import { useKeyboardShortcuts } from '../components/KeyboardShortcutsModal';

// Hooks
import {
  useClassDetail,
  useClassStudents,
  useAttendance,
  useGrades,
  useStudentEnrollment,
  usePayment,
  useToast,
  useStudentPerformance
} from '../hooks';

// State for active tab
import { useState } from 'react';

export function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();

  // Get initial tab from URL query param or default to 'students'
  const initialTab = searchParams.get('tab') || 'students';

  // Active tab state - initialize from URL
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useKeyboardShortcuts(activeTab);

  // Phase 1.3: Bulk Sessions modal state
  const [showBulkSessionsModal, setShowBulkSessionsModal] = useState(false);

  // Phase 2 modals state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // API headers helper
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  }), [session?.access_token]);

  // Initialize hooks
  const { toast, showToast, hideToast } = useToast();

  const {
    classData,
    loading,
    setLoading,
    fetchClassDetail
  } = useClassDetail(id, getHeaders);

  const {
    students,
    pagination,
    summary,
    loadingStudents,
    filters,
    searchInputValue,
    setSearchInputValue,
    handlePageChange,
    handleLimitChange,
    handlePaymentFilterChange,
    clearFilters,
    fetchStudents
  } = useClassStudents(id, getHeaders);

  const {
    sessions,
    loadingSessions,
    sessionsInfo,
    fetchSessions,
    showAttendanceModal,
    selectedSession,
    attendanceList,
    loadingAttendance,
    savingAttendance,
    attendanceSearch,
    setAttendanceSearch,
    openAttendanceModal,
    closeAttendanceModal,
    updateAttendanceStatus,
    updateAttendanceNotes,
    saveAttendance,
    getFilteredAttendanceList,
    getAttendanceSummary
  } = useAttendance(id, getHeaders);

  const {
    gradeStructures,
    gradeMatrix,
    loadingGrades,
    savingGrades,
    gradesSummary,
    editingCell,
    setEditingCell,
    pendingGrades,
    hasPendingChanges,
    fetchGrades,
    saveAllGrades,
    getDisplayScore,
    calculateWeightedAverage,
    processGradeInput,
    isCellPending
  } = useGrades(id, getHeaders);

  const {
    showAddModal,
    setShowAddModal,
    closeAddModal,
    searchQuery,
    searchResults,
    searching,
    resultType,
    handleSearch,
    enrollStudent,
    enrolling,
    showDeleteModal,
    studentToDelete,
    deleting,
    openDeleteModal,
    closeDeleteModal,
    removeStudent,
    // Bulk delete
    selectedStudentIds,
    toggleSelectStudent,
    toggleSelectAll,
    clearSelection,
    showBulkDeleteModal,
    bulkDeleting,
    bulkDeleteError,
    openBulkDeleteModal,
    closeBulkDeleteModal,
    bulkRemoveStudents
  } = useStudentEnrollment(id, getHeaders);

  const {
    showPaymentModal,
    studentToPay,
    paymentData,
    processing,
    copied,
    openPaymentModal,
    closePaymentModal,
    updatePaymentData,
    submitPayment,
    copyTransferContent
  } = usePayment(id, getHeaders);

  // Phase 2.3: Student Performance Hook
  const {
    performanceData,
    performanceSummary,
    loadingPerformance,
    performanceError,
    fetchPerformance,
    getAtRiskStudents,
    getTopPerformers,
    getDistribution
  } = useStudentPerformance(id, getHeaders);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchClassDetail(),
        fetchStudents(filters)
      ]);
      setLoading(false);
    };

    if (session?.access_token && id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, id]);

  // Reload students when filters change
  useEffect(() => {
    if (session?.access_token && id && !loading) {
      fetchStudents(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.paymentStatus, filters.search]);

  // Load sessions when switching to schedule tab
  useEffect(() => {
    if (activeTab === 'schedule' && session?.access_token && id) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load grades when switching to grades tab
  useEffect(() => {
    if (activeTab === 'grades' && session?.access_token && id) {
      fetchGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load performance when switching to performance tab
  useEffect(() => {
    if (activeTab === 'performance' && session?.access_token && id) {
      fetchPerformance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load grades when switching to grade-analytics tab (if not already loaded)
  useEffect(() => {
    if (activeTab === 'grade-analytics' && session?.access_token && id) {
      // Fetch grades if not already loaded
      if (gradeMatrix.length === 0 && !loadingGrades) {
        fetchGrades();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // P0-5: Warning when leaving page with unsaved grades
  // Handle browser/tab close with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi điểm chưa lưu. Bạn có chắc muốn rời khỏi trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasPendingChanges]);

  // Event handlers
  const handleEnroll = async (student) => {
    const result = await enrollStudent(student, classData?.courses?.price || 0);
    if (result.success) {
      showToast(`Đã thêm "${result.student.full_name}" vào lớp`, 'success');
      fetchStudents(filters);
      fetchClassDetail();
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleBatchEnroll = async (studentIds, tuitionFee) => {
    try {
      // Validation
      if (!id) {
        throw new Error('Không tìm thấy ID lớp học');
      }
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new Error('Vui lòng chọn ít nhất một học viên');
      }

      console.log('[BatchEnroll] Payload:', {
        class_id: id,
        student_ids: studentIds,
        tuition_fee: tuitionFee
      });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/admin/enrollments/batch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          class_id: id,
          student_ids: studentIds,
          tuition_fee: tuitionFee
        })
      });

      const data = await response.json();
      console.log('[BatchEnroll] Response:', data);

      if (data.success) {
        const message = data.data.skipped > 0
          ? `Đã thêm ${data.data.enrolled} học viên (${data.data.skipped} học viên đã tồn tại)`
          : `Đã thêm ${data.data.enrolled} học viên vào lớp`;
        showToast(message, 'success');
        fetchStudents(filters);
        fetchClassDetail();
      } else {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('[BatchEnroll] Error:', error);
      showToast(error.message || 'Không thể thêm học viên', 'error');
      throw error;
    }
  };

  const handleRemoveStudent = async () => {
    const result = await removeStudent();
    if (result.success) {
      showToast(`Đã xóa "${result.student.full_name}" khỏi lớp`, 'success');
      fetchStudents(filters);
      fetchClassDetail();
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleBulkRemoveStudents = async (studentsToRemove) => {
    const result = await bulkRemoveStudents(studentsToRemove);
    if (result.success) {
      showToast(`Đã xóa ${result.count} học viên khỏi lớp`, 'success');
      fetchStudents(filters);
      fetchClassDetail();
    } else if (result.message) {
      showToast(result.message, 'error');
      // Refresh to show updated list
      fetchStudents(filters);
      fetchClassDetail();
    }
  };

  const handlePaymentSubmit = async () => {
    const result = await submitPayment();
    if (result.success) {
      showToast(`Đã thu ${result.amount.toLocaleString()}đ từ "${result.student.full_name}"`, 'success');
      fetchStudents(filters);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleSaveAttendance = async () => {
    const result = await saveAttendance();
    if (result.success) {
      const { present, absent, late } = result.summary;
      showToast(`Đã lưu điểm danh: ${present} có mặt, ${absent} vắng, ${late} trễ`, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleSaveGrades = async () => {
    const result = await saveAllGrades();
    if (result.success) {
      showToast(`Đã lưu ${result.count} điểm`, 'success');
      // Refresh performance data after saving grades
      fetchPerformance();
    } else {
      showToast(result.message, 'error');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Not found
  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg text-muted-foreground">Không tìm thấy lớp học</p>
        <Button onClick={() => navigate('/admin/classes')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ClassHeader classData={classData} />

      {/* Phase 2 Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTransferModal(true)}
          className="text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          <Copy className="w-4 h-4 mr-2" />
          Chuyển học viên
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReportModal(true)}
          className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
        >
          <FileText className="w-4 h-4 mr-2" />
          Xuất báo cáo CSV
        </Button>

        {/* Quick Navigation to Reports Module */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/reports/attendance?classId=${id}`)}
          className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Báo cáo chuyên cần
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/reports/grades?classId=${id}`)}
          className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Báo cáo điểm số
        </Button>

        <Button
          size="sm"
          onClick={() => navigate(`/admin/enrollments/new?classId=${id}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Ghi danh vào lớp
        </Button>
      </div>

      {/* Tabs Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-slate-200 dark:border-zinc-800">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <TabButton
            active={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            icon={Users}
          >
            Học viên ({students.length})
          </TabButton>
          <TabButton
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
            icon={Calendar}
          >
            Lịch trình & Điểm danh
          </TabButton>
          <TabButton
            active={activeTab === 'grades'}
            onClick={() => setActiveTab('grades')}
            icon={GraduationCap}
          >
            Bảng điểm
          </TabButton>
          <TabButton
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
            icon={TrendingUp}
          >
            Hiệu suất
          </TabButton>
          <TabButton
            active={activeTab === 'grade-analytics'}
            onClick={() => setActiveTab('grade-analytics')}
            icon={BarChart3}
          >
            Thống kê điểm
          </TabButton>
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            icon={FolderOpen}
          >
            Tài liệu
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'students' && (
            <StudentsTab
              students={students}
              pagination={pagination}
              summary={summary}
              loading={loadingStudents}
              filters={filters}
              searchInputValue={searchInputValue}
              onSearchChange={setSearchInputValue}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onPaymentFilterChange={handlePaymentFilterChange}
              onClearFilters={clearFilters}
              onAddClick={() => setShowAddModal(true)}
              onPaymentClick={openPaymentModal}
              onDeleteClick={openDeleteModal}
              // Bulk selection props
              selectedStudentIds={selectedStudentIds}
              onToggleSelect={toggleSelectStudent}
              onToggleSelectAll={toggleSelectAll}
              onClearSelection={clearSelection}
              onBulkDelete={openBulkDeleteModal}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              sessions={sessions}
              sessionsInfo={sessionsInfo}
              loading={loadingSessions}
              classSchedule={classData?.schedule}
              onAttendanceClick={openAttendanceModal}
              onCreateSessions={() => setShowBulkSessionsModal(true)}
            />
          )}

          {activeTab === 'grades' && (
            <GradesTab
              gradeStructures={gradeStructures}
              gradeMatrix={gradeMatrix}
              loading={loadingGrades}
              saving={savingGrades}
              gradesSummary={gradesSummary}
              editingCell={editingCell}
              pendingGrades={pendingGrades}
              hasPendingChanges={hasPendingChanges}
              onEditCell={setEditingCell}
              onSaveAll={handleSaveGrades}
              getDisplayScore={getDisplayScore}
              calculateWeightedAverage={calculateWeightedAverage}
              processGradeInput={processGradeInput}
              isCellPending={isCellPending}
              showToast={showToast}
            />
          )}

          {activeTab === 'performance' && (
            <StudentPerformanceTab
              classId={id}
              performanceData={performanceData}
              loading={loadingPerformance}
              onRefresh={fetchPerformance}
            />
          )}

          {activeTab === 'grade-analytics' && (
            <GradeAnalyticsTab
              gradeStructures={gradeStructures}
              gradeMatrix={gradeMatrix}
              loading={loadingGrades}
              onRefresh={fetchGrades}
            />
          )}

          {activeTab === 'documents' && (
            <ClassDocumentsTab
              classId={id}
              className={classData?.name}
              courseId={classData?.course_id}
              getHeaders={getHeaders}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        show={showAddModal}
        onClose={closeAddModal}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        searching={searching}
        resultType={resultType}
        enrolling={enrolling}
        onEnroll={handleEnroll}
        onBatchEnroll={handleBatchEnroll}
        defaultTuitionFee={classData?.courses?.price || 0}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        student={studentToDelete}
        deleting={deleting}
        onConfirm={handleRemoveStudent}
        onCancel={closeDeleteModal}
      />

      <BulkRemoveStudentsModal
        show={showBulkDeleteModal}
        students={students.filter(s => selectedStudentIds.includes(s.student_id))}
        deleting={bulkDeleting}
        error={bulkDeleteError}
        onConfirm={handleBulkRemoveStudents}
        onCancel={closeBulkDeleteModal}
      />

      <PaymentModal
        show={showPaymentModal}
        student={studentToPay}
        classData={classData}
        paymentData={paymentData}
        processing={processing}
        copied={copied}
        onClose={closePaymentModal}
        onUpdatePaymentData={updatePaymentData}
        onSubmit={handlePaymentSubmit}
        onCopyTransferContent={copyTransferContent}
      />

      <AttendanceModal
        show={showAttendanceModal}
        session={selectedSession}
        attendanceList={getFilteredAttendanceList()}
        loading={loadingAttendance}
        saving={savingAttendance}
        searchQuery={attendanceSearch}
        onSearchChange={setAttendanceSearch}
        onUpdateStatus={updateAttendanceStatus}
        onUpdateNotes={updateAttendanceNotes}
        onSave={handleSaveAttendance}
        onClose={closeAttendanceModal}
        summary={getAttendanceSummary()}
      />

      {/* Phase 1.3: Bulk Sessions Modal */}
      <BulkSessionsModal
        isOpen={showBulkSessionsModal}
        onClose={() => setShowBulkSessionsModal(false)}
        classData={classData}
        existingSessionsCount={sessionsInfo?.total || 0}
        onSuccess={(data) => {
          fetchSessions();
          showToast(`Đã tạo ${data.count} buổi học thành công`, 'success');
        }}
      />

      {/* Phase 2 Modals */}
      <StudentTransferModal
        show={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        classId={id}
        students={students}
        onSuccess={() => {
          fetchStudents(filters);
          fetchClassDetail();
          showToast('Chuyển học viên thành công', 'success');
        }}
      />

      <ClassReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        classId={id}
        classData={classData}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        activeTab={activeTab}
      />

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Keyboard Shortcuts Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 p-3 bg-card border border-border rounded-full shadow-lg hover:bg-muted transition-colors z-40"
        title="Phím tắt (nhấn ? để mở)"
      >
        <Keyboard className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  );
}

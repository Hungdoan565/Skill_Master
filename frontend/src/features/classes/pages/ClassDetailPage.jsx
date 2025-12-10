/**
 * ClassDetailPage - Main Container Component
 * Orchestrates all sub-components and hooks
 */

import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft, Users, Calendar, GraduationCap, UserPlus, Mail, FileText, Copy } from 'lucide-react';

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
  // Phase 2 Components
  BatchStudentEnrollmentModal,
  StudentTransferModal,
  ClassNotificationModal,
  ClassReportModal
} from '../components';

// Hooks
import {
  useClassDetail,
  useClassStudents,
  useAttendance,
  useGrades,
  useStudentEnrollment,
  usePayment,
  useToast
} from '../hooks';

// State for active tab
import { useState } from 'react';

export function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('students');
  
  // Phase 2 modals state
  const [showBatchEnrollModal, setShowBatchEnrollModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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
        <p className="text-lg text-slate-600">Không tìm thấy lớp học</p>
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
          onClick={() => setShowBatchEnrollModal(true)}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Ghi danh hàng loạt
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTransferModal(true)}
          className="text-purple-600 border-purple-300 hover:bg-purple-50"
        >
          <Copy className="w-4 h-4 mr-2" />
          Chuyển học viên
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNotificationModal(true)}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          <Mail className="w-4 h-4 mr-2" />
          Gửi thông báo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReportModal(true)}
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          <FileText className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Tabs Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200">
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

      {/* Phase 2 Modals */}
      <BatchStudentEnrollmentModal
        show={showBatchEnrollModal}
        onClose={() => setShowBatchEnrollModal(false)}
        classId={id}
        classData={classData}
        onSuccess={() => {
          fetchStudents(filters);
          fetchClassDetail();
          showToast('Ghi danh hàng loạt thành công', 'success');
        }}
      />

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

      <ClassNotificationModal
        show={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        classId={id}
        students={students}
        onSuccess={() => {
          showToast('Đã gửi thông báo thành công', 'success');
        }}
      />

      <ClassReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        classId={id}
        classData={classData}
      />

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}

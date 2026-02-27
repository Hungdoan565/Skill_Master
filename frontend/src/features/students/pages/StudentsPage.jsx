/**
 * StudentsPage Component
 * Trang quản lý học viên - refactored version
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UserPlus, Upload, Download } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { exportStudentsToExcel } from '../utils/export-students-excel';
import { useStudents } from '../hooks';
import {
  StudentFilters,
  StudentsTable,
  PromoteModal,
  LoadingState,
  StudentDetailModal,
  EditStudentModal,
  StudentImportModal,
} from '../components';

export function StudentsPage() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [promoteModal, setPromoteModal] = useState({ isOpen: false, student: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, student: null, data: null, loading: false });
  const [editModal, setEditModal] = useState({ isOpen: false, student: null, submitting: false });
  const [showImportModal, setShowImportModal] = useState(false);

  const {
    students,
    loading,
    fetchStudents,
    fetchStudentDetail,
    updateStudent,
    promoteStudent,
    filterStudents
  } = useStudents();

  // Fetch students on mount and when filter changes
  useEffect(() => {
    fetchStudents(statusFilter);
  }, [fetchStudents, statusFilter]);

  // Filter students locally by search
  const filteredStudents = filterStudents(searchTerm);
  const centerName = profile?.centers?.name || 'Skill Master';

  // Handle view details
  const handleViewDetails = useCallback(async (student) => {
    setDetailModal({ isOpen: true, student, data: null, loading: true });

    try {
      const data = await fetchStudentDetail(student.id);
      setDetailModal(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      console.error('Error fetching student detail:', error);
      setDetailModal(prev => ({ ...prev, loading: false }));
    }
  }, [fetchStudentDetail]);

  // Close detail modal
  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, student: null, data: null, loading: false });
  };

  // Handle edit click
  const handleEditClick = (student) => {
    setEditModal({ isOpen: true, student, submitting: false });
  };

  // Handle edit submit
  const handleEditSubmit = async (studentId, data) => {
    setEditModal(prev => ({ ...prev, submitting: true }));

    try {
      await updateStudent(studentId, data);
      setEditModal({ isOpen: false, student: null, submitting: false });
      toast.success('Cập nhật thông tin học viên thành công!');
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật');
      setEditModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModal({ isOpen: false, student: null, submitting: false });
  };

  // Handle promote click
  const handlePromoteClick = (student) => {
    setPromoteModal({ isOpen: true, student });
  };

  // Handle promote confirm
  const handlePromoteConfirm = async (studentId, roleCode) => {
    await promoteStudent(studentId, roleCode);
  };

  // Close promote modal
  const closePromoteModal = () => {
    setPromoteModal({ isOpen: false, student: null });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Học viên</h1>
          <p className="text-muted-foreground">
            Danh sách học viên đã đăng ký tài khoản
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportStudentsToExcel(students, centerName)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <Link to="/admin/enrollments/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" /> Ghi danh
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 border border-green-200">
            <GraduationCap className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {students.length} học viên
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar & Table */}
      <Card>
        <CardHeader className="pb-3">
          <StudentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            filteredCount={filteredStudents.length}
            totalCount={students.length}
          />
        </CardHeader>

        <CardContent>
          {/* DataTable handles loading state internally */}
          <StudentsTable
            students={filteredStudents}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEditClick}
            onPromote={handlePromoteClick}
          />
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        student={detailModal.student}
        detailData={detailModal.data}
        loading={detailModal.loading}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        student={editModal.student}
        onSubmit={handleEditSubmit}
        submitting={editModal.submitting}
      />

      {/* Promote Modal */}
      <PromoteModal
        isOpen={promoteModal.isOpen}
        onClose={closePromoteModal}
        student={promoteModal.student}
        onConfirm={handlePromoteConfirm}
      />

      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(count) => {
          toast.success(`Đã import ${count} học viên thành công!`);
          fetchStudents(statusFilter);
        }}
      />
    </div>
  );
}

export default StudentsPage;

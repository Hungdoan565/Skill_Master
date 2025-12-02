/**
 * StudentsPage Component
 * Trang quản lý học viên - refactored version
 */

import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { useStudents } from '../hooks';
import {
  StudentFilters,
  StudentsTable,
  PromoteModal,
  LoadingState,
} from '../components';

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [promoteModal, setPromoteModal] = useState({ isOpen: false, student: null });

  const { students, loading, fetchStudents, promoteStudent, filterStudents } = useStudents();

  // Fetch students on mount and when filter changes
  useEffect(() => {
    fetchStudents(statusFilter);
  }, [fetchStudents, statusFilter]);

  // Filter students locally by search
  const filteredStudents = filterStudents(searchTerm);

  // Handle view details
  const handleViewDetails = (student) => {
    alert(`Chi tiết: ${student.full_name}\nEmail: ${student.email}`);
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
        {/* Stats */}
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 border border-green-200">
          <GraduationCap className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            {students.length} học viên
          </span>
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
          {loading ? (
            <LoadingState />
          ) : (
            <StudentsTable
              students={filteredStudents}
              onViewDetails={handleViewDetails}
              onPromote={handlePromoteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Promote Modal */}
      <PromoteModal
        isOpen={promoteModal.isOpen}
        onClose={closePromoteModal}
        student={promoteModal.student}
        onConfirm={handlePromoteConfirm}
      />
    </div>
  );
}

export default StudentsPage;

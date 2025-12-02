/**
 * CoursesPage - Trang quản lý khóa học
 */

import { useEffect, useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

// Feature imports
import { useCourses } from '../hooks';
import { 
  CourseFilters, 
  CourseTable, 
  CreateCourseModal,
  EditCourseModal,
  DeleteConfirmModal,
  GradeStructureModal 
} from '../components';

export function CoursesPage() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Edit modal state
  const [editModal, setEditModal] = useState({ 
    open: false, 
    course: null 
  });
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ 
    open: false, 
    course: null,
    loading: false,
    error: null
  });
  
  // Grade structure modal state
  const [gradeStructureModal, setGradeStructureModal] = useState({ 
    open: false, 
    course: null 
  });

  // Hooks
  const {
    courses,
    loading,
    deletingId,
    fetchCourses,
    deleteCourse,
    filterCourses
  } = useCourses(accessToken);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Filtered courses
  const filteredCourses = filterCourses(searchTerm);

  // Handlers
  const handleOpenEdit = (course) => {
    setEditModal({ open: true, course });
  };

  const handleCloseEdit = () => {
    setEditModal({ open: false, course: null });
  };

  const handleOpenDelete = (course) => {
    setDeleteModal({ open: true, course, loading: false, error: null });
  };

  const handleCloseDelete = () => {
    setDeleteModal({ open: false, course: null, loading: false, error: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.course) return;
    
    setDeleteModal(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await deleteCourse(deleteModal.course.id);
      handleCloseDelete();
    } catch (err) {
      setDeleteModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.response?.data?.message || 'Không thể xóa khóa học' 
      }));
    }
  };

  const handleOpenGradeConfig = (course) => {
    setGradeStructureModal({ open: true, course });
  };

  const handleCloseGradeConfig = () => {
    setGradeStructureModal({ open: false, course: null });
  };

  const handleCreateSuccess = () => {
    fetchCourses();
  };

  const handleEditSuccess = () => {
    fetchCourses();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Khóa học</h1>
          <p className="text-muted-foreground">
            Danh sách tất cả khóa học của trung tâm
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo khóa học
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3">
          <CourseFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            totalCount={filteredCourses.length}
          />
        </CardHeader>
        <CardContent>
          <CourseTable
            courses={filteredCourses}
            loading={loading}
            searchTerm={searchTerm}
            deletingId={deletingId}
            onDelete={handleOpenDelete}
            onEdit={handleOpenEdit}
            onConfigGrade={handleOpenGradeConfig}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        accessToken={accessToken}
      />

      {/* Edit Modal */}
      <EditCourseModal
        isOpen={editModal.open}
        onClose={handleCloseEdit}
        onSuccess={handleEditSuccess}
        course={editModal.course}
        accessToken={accessToken}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        course={deleteModal.course}
        loading={deleteModal.loading}
        error={deleteModal.error}
      />

      {/* Grade Structure Modal */}
      <GradeStructureModal
        isOpen={gradeStructureModal.open}
        onClose={handleCloseGradeConfig}
        course={gradeStructureModal.course}
        accessToken={accessToken}
      />
    </div>
  );
}

export default CoursesPage;

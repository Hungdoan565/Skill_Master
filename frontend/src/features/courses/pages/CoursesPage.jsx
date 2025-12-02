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
  GradeStructureModal 
} from '../components';

export function CoursesPage() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const handleOpenGradeConfig = (course) => {
    setGradeStructureModal({ open: true, course });
  };

  const handleCloseGradeConfig = () => {
    setGradeStructureModal({ open: false, course: null });
  };

  const handleCreateSuccess = () => {
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
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
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
            onDelete={deleteCourse}
            onEdit={() => {}} // TODO: Implement edit
            onConfigGrade={handleOpenGradeConfig}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        accessToken={accessToken}
      />

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

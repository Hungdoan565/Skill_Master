/**
 * CoursesPage - Trang quản lý khóa học với đầy đủ tính năng
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/useDebounce';

// Feature imports
import { useCourses } from '../hooks';
import {
  CourseFilters,
  CourseTable,
  CreateCourseModal,
  EditCourseModal,
  DeleteConfirmModal,
  GradeStructureModal,
  CourseAnalyticsModal,
  BatchActionsToolbar
} from '../components';

export function CoursesPage() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState([]);

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

  // Analytics modal state
  const [analyticsModal, setAnalyticsModal] = useState({
    open: false,
    course: null
  });

  // Clone state - pre-fill create modal
  const [cloneData, setCloneData] = useState(null);

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

  // Clear selection when courses change
  useEffect(() => {
    setSelectedIds([]);
  }, [courses]);

  // Debounced search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Advanced filtering & sorting
  const filteredAndSortedCourses = useMemo(() => {
    let result = filterCourses(debouncedSearch, statusFilter);

    // Category filter (case-insensitive)
    if (categoryFilter) {
      result = result.filter(c =>
        c.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Price range filter
    if (priceRange.min) {
      result = result.filter(c => c.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter(c => c.price <= Number(priceRange.max));
    }

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'name_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name_desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'sessions_asc':
          return (a.total_sessions || 0) - (b.total_sessions || 0);
        case 'sessions_desc':
          return (b.total_sessions || 0) - (a.total_sessions || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [courses, debouncedSearch, statusFilter, categoryFilter, priceRange, sortBy, filterCourses]);

  // Clear selection when filters change
  useEffect(() => {
    if (categoryFilter || priceRange.min || priceRange.max || statusFilter) {
      setSelectedIds([]);
    }
  }, [categoryFilter, priceRange, statusFilter]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setStatusFilter('');
    setCategoryFilter('');
    setPriceRange({ min: '', max: '' });
  }, []);

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

  // Analytics handlers
  const handleOpenAnalytics = (course) => {
    setAnalyticsModal({ open: true, course });
  };

  const handleCloseAnalytics = () => {
    setAnalyticsModal({ open: false, course: null });
  };

  // Clone handler
  const handleClone = (course) => {
    // Pre-fill data with new code
    setCloneData({
      code: `${course.code}-COPY`,
      title: `${course.title} (Copy)`,
      category: course.category,
      level: course.level,
      total_sessions: course.total_sessions,
      duration_weeks: course.duration_weeks,
      price: String(course.price),
      cover_image: course.cover_image || '',
      description: course.description || '',
      status: 'draft'
    });
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    fetchCourses();
    setCloneData(null);
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setCloneData(null);
  };

  const handleEditSuccess = () => {
    fetchCourses();
  };

  const handleBatchSuccess = () => {
    fetchCourses();
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Khóa học</h1>
          <p className="text-muted-foreground">
            Danh mục khóa học và trạng thái hiển thị cho học viên
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

      {/* Batch Actions Toolbar */}
      <BatchActionsToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        accessToken={accessToken}
        onSuccess={handleBatchSuccess}
      />

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3">
          <CourseFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            totalCount={filteredAndSortedCourses.length}
            onClearFilters={handleClearFilters}
            courses={courses}
          />
        </CardHeader>
        <CardContent>
          <CourseTable
            courses={filteredAndSortedCourses}
            loading={loading}
            searchTerm={searchTerm}
            deletingId={deletingId}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onDelete={handleOpenDelete}
            onEdit={handleOpenEdit}
            onClone={handleClone}
            onViewAnalytics={handleOpenAnalytics}
            onConfigGrade={handleOpenGradeConfig}
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={handleCloseCreate}
        onSuccess={handleCreateSuccess}
        accessToken={accessToken}
        initialData={cloneData}
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

      {/* Analytics Modal */}
      <CourseAnalyticsModal
        isOpen={analyticsModal.open}
        onClose={handleCloseAnalytics}
        course={analyticsModal.course}
        accessToken={accessToken}
      />
    </div>
  );
}

export default CoursesPage;

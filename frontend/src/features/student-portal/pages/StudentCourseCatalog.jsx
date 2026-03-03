import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Users, Clock, GraduationCap, X, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAvailableCourses } from '../hooks/useAvailableCourses';
import { useEnrollmentRequests } from '../hooks/useEnrollmentRequests';
import { gooeyToast } from 'goey-toast';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const statusConfig = {
  pending: { label: 'Chờ duyệt', variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
  approved: { label: 'Đã duyệt', variant: 'outline', className: 'border-blue-500 text-blue-700 bg-blue-50' },
  enrolled: { label: 'Đã đăng ký', variant: 'outline', className: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Từ chối', variant: 'outline', className: 'border-red-500 text-red-700 bg-red-50' },
  waitlisted: { label: 'Chờ slot', variant: 'outline', className: 'border-orange-500 text-orange-700 bg-orange-50' },
  cancelled: { label: 'Đã hủy', variant: 'outline', className: 'border-gray-400 text-gray-600 bg-gray-50' },
};

export default function StudentCourseCatalog() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { courses, loading: coursesLoading } = useAvailableCourses(search);
  const { requests, loading: requestsLoading, cancelRequest } = useEnrollmentRequests();
  const [cancellingId, setCancellingId] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCancelRequest = async (id) => {
    try {
      setCancellingId(id);
      await cancelRequest(id);
      gooeyToast.success('Đã hủy yêu cầu đăng ký');
    } catch (error) {
      gooeyToast.error(error.message || 'Lỗi khi hủy yêu cầu');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Khóa học đang mở</h1>
            <p className="text-sm text-muted-foreground">Khám phá và đăng ký các khóa học mới</p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Tìm kiếm khóa học..." 
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit">Tìm</Button>
        </form>
      </div>

      {coursesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-32 bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-4">
                <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                <div className="flex justify-between pt-4">
                  <div className="h-5 bg-muted animate-pulse rounded w-1/4" />
                  <div className="h-5 bg-muted animate-pulse rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !courses || courses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Không có khóa học nào đang mở tại trung tâm</h3>
          <p className="text-sm text-muted-foreground mt-1">Vui lòng quay lại sau hoặc liên hệ trung tâm để biết thêm chi tiết.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-all flex flex-col">
              <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center border-b">
                <GraduationCap className="h-12 w-12 text-blue-500/50" />
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1" title={course.title}>{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {course.description || 'Chưa có mô tả'}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{(course.classes || []).length} lớp đang mở</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{(course.classes || []).reduce((sum, cls) => sum + (cls.available_slots || 0), 0)} chỗ trống</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {formatCurrency(course.price)}
                  </span>
                  <Link to={`/student/courses/${course.id}`}>
                    <Button size="sm">Xem chi tiết</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Yêu cầu đăng ký */}
      <div className="mt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4">Yêu cầu đăng ký của bạn</h2>
        {requestsLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Đang tải yêu cầu...</span>
              </div>
            </CardContent>
          </Card>
        ) : !requests || requests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Bạn chưa có yêu cầu đăng ký nào.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const status = statusConfig[req.status] || statusConfig.pending;
              const isCancellable = req.status === 'pending' || req.status === 'waitlisted';
              
              return (
                <Card key={req.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{req.class_name}</h4>
                        <Badge variant={status.variant} className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center"><BookOpen className="mr-1 h-3 w-3" /> {req.course_name}</span>
                        <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {formatDate(req.created_at)}</span>
                      </p>
                    </div>
                    {isCancellable && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={cancellingId === req.id}
                      >
                        {cancellingId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-1 h-4 w-4" />
                            Hủy yêu cầu
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

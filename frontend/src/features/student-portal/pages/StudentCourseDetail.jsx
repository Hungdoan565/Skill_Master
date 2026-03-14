import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Clock, MapPin, Calendar, GraduationCap, User, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useEnrollmentRequests } from '../hooks/useEnrollmentRequests';
import { formatScheduleDisplay } from '@/features/classes/utils/formatters';
import { getClassActionState, resolveJourneyStatus } from '../utils';
import { gooeyToast } from 'goey-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
};

const getTeacherName = (cls) => cls?.teacher?.full_name || cls?.teacher_name || 'Chưa phân công';

function CourseHeroMedia({ src, alt }) {
  const [imageError, setImageError] = useState(false);
  const shouldShowImage = Boolean(src) && !imageError;

  return (
    <div className="h-28 md:h-32 relative overflow-hidden border-b">
      {shouldShowImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain bg-muted/20 p-2"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center px-8 relative overflow-hidden">
          <GraduationCap className="h-24 w-24 text-blue-500/20 absolute -right-4 -bottom-4" />
          <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm shadow-sm z-10">
            <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentCourseDetail() {
  const { courseId: id } = useParams();
  const { session } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { submitRequest } = useEnrollmentRequests();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourseData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/student/available-courses/${id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCourse(result.data);
      } else {
        setError(result.message || 'Không tìm thấy khóa học');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, session?.access_token]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleEnrollClick = (cls) => {
    setSelectedClass(cls);
    setEnrollMessage('');
    setIsDialogOpen(true);
  };

  const handleSubmitEnrollment = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    try {
      await submitRequest(selectedClass.id, enrollMessage);
      gooeyToast.success('Đã gửi yêu cầu đăng ký thành công');
      setIsDialogOpen(false);
      fetchCourseData(); // Refresh to get updated request status
    } catch (err) {
      gooeyToast.error(err.message || 'Lỗi khi gửi yêu cầu đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/student/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách khóa học
          </Link>
        </div>
        <Card>
          <CardHeader className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted animate-pulse rounded w-full mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded w-full mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="p-6 h-40 bg-muted animate-pulse" /></Card>
            <Card><CardContent className="p-6 h-40 bg-muted animate-pulse" /></Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/student/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách khóa học
          </Link>
        </div>
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <div className="p-4 rounded-full bg-red-50 mb-4">
            <GraduationCap className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">{error || 'Không tìm thấy khóa học'}</h3>
        </Card>
      </div>
    );
  }

  const classGridClass = (course.classes?.length || 0) <= 1
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 xl:grid-cols-2 gap-4';

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/student/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách khóa học
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <Card className="overflow-hidden border-none shadow-md xl:col-span-4 xl:sticky xl:top-20">
            <CourseHeroMedia src={course.cover_image} alt={course.title} />
            <CardContent className="p-6 space-y-4">
              <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center"><BookOpen className="mr-2 h-4 w-4" /> {course.classes?.length || 0} lớp học</span>
                {course.duration_weeks && <span className="flex items-center"><Clock className="mr-2 h-4 w-4" /> {course.duration_weeks} tuần</span>}
              </div>

              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {course.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
              </p>

              <div className="p-4 bg-muted/30 rounded-xl border flex flex-col items-start">
                <span className="text-xs text-muted-foreground mb-1">Học phí</span>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(course.price)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 xl:col-span-8">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Danh sách lớp học
            </h2>

            {(!course.classes || course.classes.length === 0) ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Khóa học này hiện chưa có lớp nào đang mở.
                </CardContent>
              </Card>
            ) : (
              <div className={classGridClass}>
                {course.classes.map((cls) => {
              const enrolledCount = cls.enrolled_count || 0;
              const maxStudents = cls.capacity || cls.max_students || 0; // handle different db naming
              const isFull = enrolledCount >= maxStudents && maxStudents > 0;
              const percentFull = maxStudents > 0 ? (enrolledCount / maxStudents) * 100 : 0;
              
              let progressColor = "bg-green-500";
              if (percentFull >= 100) progressColor = "bg-red-500";
              else if (percentFull >= 80) progressColor = "bg-yellow-500";

              const resolvedStatus = resolveJourneyStatus({
                journeyStatus: cls.journey_status,
                enrollmentStatus: cls.enrollment_status,
                requestStatus: cls.request_status,
              });

              const actionState = getClassActionState({
                status: resolvedStatus,
                isFull,
              });

              let ActionComponent;
              if (actionState.type === 'badge') {
                ActionComponent = (
                  <Badge variant="outline" className={cn('w-full justify-center py-2 text-sm', actionState.className)}>
                    {actionState.label}
                  </Badge>
                );
              } else {
                const buttonClass = actionState.mode === 'waitlist'
                  ? 'w-full bg-orange-600 hover:bg-orange-700 text-white'
                  : 'w-full bg-green-600 hover:bg-green-700 text-white';

                ActionComponent = (
                  <Button
                    className={buttonClass}
                    onClick={() => handleEnrollClick(cls)}
                  >
                    {actionState.label}
                  </Button>
                );
              }

                  return (
                    <Card key={cls.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg mb-1">{cls.name}</CardTitle>
                        <p className="text-sm text-muted-foreground font-mono">{cls.code}</p>
                      </div>
                      <Badge variant="secondary" className="bg-white dark:bg-gray-800 shadow-sm">
                        {isFull ? 'Hết chỗ' : 'Còn chỗ'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <User className="mr-2 h-4 w-4" />
                        <span className="truncate" title={getTeacherName(cls)}>
                          {getTeacherName(cls)}
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span className="truncate" title={cls.room || 'Chưa xếp phòng'}>
                          {cls.room || 'Chưa xếp phòng'}
                        </span>
                      </div>
                      <div className="flex items-center text-muted-foreground col-span-2">
                        <Calendar className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate" title={formatScheduleDisplay(cls.schedule)}>
                          {formatScheduleDisplay(cls.schedule)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sĩ số</span>
                        <span className="font-medium">{enrolledCount} / {maxStudents}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${progressColor} transition-all duration-500`}
                          style={{ width: `${Math.min(percentFull, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      {ActionComponent}
                    </div>
                  </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận đăng ký</DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">{selectedClass.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center"><User className="mr-2 h-4 w-4" /> {getTeacherName(selectedClass)}</p>
                  <p className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> {formatScheduleDisplay(selectedClass.schedule)}</p>
                  <p className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> {selectedClass.room || 'Chưa xếp phòng'}</p>
                </div>
              </div>

              {(selectedClass.enrolled_count >= (selectedClass.capacity || selectedClass.max_students)) && (
                <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500" />
                  <p>Lớp đã đầy. Yêu cầu của bạn sẽ được chuyển vào danh sách chờ.</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Ghi chú (không bắt buộc)</label>
                <Textarea 
                  placeholder="Nhập ghi chú nếu có..." 
                  value={enrollMessage}
                  onChange={(e) => setEnrollMessage(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmitEnrollment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

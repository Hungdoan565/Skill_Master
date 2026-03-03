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
import { gooeyToast } from 'goey-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/student/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách khóa học
        </Link>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center px-8 relative overflow-hidden">
          <GraduationCap className="h-24 w-24 text-blue-500/20 absolute -right-4 -bottom-4" />
          <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm shadow-sm z-10">
            <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center"><BookOpen className="mr-2 h-4 w-4" /> {course.classes?.length || 0} lớp học</span>
                {course.duration_weeks && <span className="flex items-center"><Clock className="mr-2 h-4 w-4" /> {course.duration_weeks} tuần</span>}
              </div>
              <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                {course.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
              </p>
            </div>
            <div className="shrink-0 p-6 bg-muted/30 rounded-2xl border flex flex-col items-center text-center min-w-[200px]">
              <span className="text-sm text-muted-foreground mb-1">Học phí</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(course.price)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {course.classes.map((cls) => {
              const enrolledCount = cls.enrolled_count || 0;
              const maxStudents = cls.capacity || cls.max_students || 0; // handle different db naming
              const isFull = enrolledCount >= maxStudents && maxStudents > 0;
              const percentFull = maxStudents > 0 ? (enrolledCount / maxStudents) * 100 : 0;
              
              let progressColor = "bg-green-500";
              if (percentFull >= 100) progressColor = "bg-red-500";
              else if (percentFull >= 80) progressColor = "bg-yellow-500";

              let ActionComponent;
              
              if (cls.enrollment_status === 'enrolled' || cls.enrollment_status === 'active') {
                ActionComponent = <Badge variant="outline" className="w-full justify-center py-2 text-sm border-emerald-500 text-emerald-700 bg-emerald-50">Đã đăng ký</Badge>;
              } else if (cls.request_status === 'pending') {
                ActionComponent = <Badge variant="outline" className="w-full justify-center py-2 text-sm border-yellow-500 text-yellow-700 bg-yellow-50">Đang chờ duyệt</Badge>;
              } else if (cls.request_status === 'waitlisted') {
                ActionComponent = <Badge variant="outline" className="w-full justify-center py-2 text-sm border-orange-500 text-orange-700 bg-orange-50">Đang trong danh sách chờ</Badge>;
              } else if (cls.request_status === 'rejected') {
                ActionComponent = <Badge variant="outline" className="w-full justify-center py-2 text-sm border-red-500 text-red-700 bg-red-50">Đã bị từ chối</Badge>;
              } else if (isFull) {
                ActionComponent = (
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                    onClick={() => handleEnrollClick(cls)}
                  >
                    Đăng ký chờ slot
                  </Button>
                );
              } else {
                ActionComponent = (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => handleEnrollClick(cls)}
                  >
                    Đăng ký
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
                        <span className="truncate" title={cls.teacher_name || 'Chưa phân công'}>
                          {cls.teacher_name || 'Chưa phân công'}
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
                        <span className="truncate" title={cls.schedule || 'Chưa có lịch'}>
                          {cls.schedule || 'Chưa có lịch'}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận đăng ký</DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">{selectedClass.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center"><User className="mr-2 h-4 w-4" /> {selectedClass.teacher_name || 'Chưa phân công'}</p>
                  <p className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> {selectedClass.schedule || 'Chưa có lịch'}</p>
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

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useStudentDashboard } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  CheckCircle, 
  Award, 
  CreditCard, 
  Clock, 
  MapPin,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatTime = (time) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-none shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <CardContent className="p-4 flex flex-col items-center text-center justify-center gap-3">
        <div className={cn('p-3 rounded-full', colorStyles[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick, color = 'blue' }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
    green: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30'
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 w-full",
        colorStyles[color]
      )}
    >
      <div className="p-2 bg-white dark:bg-gray-950 rounded-full shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function CourseProgressItem({ course }) {
  // Mock progress if not available, or use attendance/total
  const progress = course.progress || 0;
  const total = course.total_sessions || 0;
  const attended = course.attended_sessions || 0;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium truncate">{course.course_name}</span>
        <span className="text-muted-foreground">{attended}/{total} buổi</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ClassItem({ classItem }) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-foreground">{classItem.class_name || classItem.name}</p>
        <p className="text-sm text-muted-foreground">{classItem.course_name}</p>
      </div>
      <div className="text-right text-sm">
        <div className="flex items-center justify-end gap-1.5 font-medium text-foreground">
          <Clock className="h-4 w-4 text-blue-500" />
          <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5 text-muted-foreground mt-1">
          <MapPin className="h-4 w-4" />
          <span>{classItem.room_name || 'Chưa xếp phòng'}</span>
        </div>
      </div>
    </div>
  );
}

function GradeItem({ grade }) {
  const gradeColor = grade.score >= 8 ? 'text-green-600 dark:text-green-400' : 
                     grade.score >= 6.5 ? 'text-blue-600 dark:text-blue-400' : 
                     grade.score >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0 border-border/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{grade.class_name}</p>
        <p className="text-sm text-muted-foreground">{grade.grade_type || grade.type}</p>
      </div>
      <div className={cn('text-xl font-bold font-mono', gradeColor)}>
        {grade.score?.toFixed(1) || 'N/A'}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
      <Icon className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data, loading, error, refresh } = useStudentDashboard();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-destructive/5 rounded-2xl max-w-md w-full border border-destructive/20">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const todayClasses = data?.todayClasses || [];
  // Use upcomingClasses if available, otherwise fallback to todayClasses
  const displayClasses = data?.upcomingClasses || todayClasses;
  const recentGrades = data?.recentGrades || [];
  const unpaidInvoices = data?.unpaidInvoices || [];
  const studentName = data?.student?.full_name || profile?.full_name || 'Học viên';
  const enrollments = data?.enrollments || [];

  const isToday = !data?.upcomingClasses;
  const scheduleTitle = isToday ? "Lịch học hôm nay" : "Lịch học sắp tới";

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-orange-100 mb-2 bg-black/10 w-fit px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              {formatDate(new Date())}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Xin chào, {studentName}! 👋</h1>
            <p className="text-orange-100/90 text-lg font-medium max-w-lg">
              "Học, học nữa, học mãi" - V.I. Lenin
            </p>
          </div>
          
          <button
            onClick={refresh}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-white shadow-sm border border-white/20"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction 
          icon={Calendar} 
          label="Xem lịch học" 
          color="blue" 
          onClick={() => navigate('/student/schedule')} 
        />
        <QuickAction 
          icon={Award} 
          label="Xem điểm số" 
          color="green" 
          onClick={() => navigate('/student/grades')} 
        />
        <QuickAction 
          icon={CreditCard} 
          label="Thanh toán" 
          color="orange" 
          onClick={() => navigate('/student/invoices')} 
        />
        <QuickAction 
          icon={BookOpen} 
          label="Khóa học" 
          color="purple" 
          onClick={() => navigate('/student/courses')} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={BookOpen}
          label="Lớp đang học"
          value={stats.totalClasses || 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Tỷ lệ chuyên cần"
          value={`${stats.attendanceRate || 0}%`}
          color="green"
        />
        <StatCard
          icon={Award}
          label="Điểm trung bình"
          value={stats.avgGrade ?? 'N/A'}
          color="orange"
        />
        <StatCard
          icon={CreditCard}
          label="Học phí còn lại"
          value={formatCurrency(stats.unpaidAmount)}
          color={stats.unpaidAmount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Course Progress Section (Conditional) */}
      {enrollments.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tiến độ khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((course) => (
                <CourseProgressItem key={course.id} course={course} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Schedule (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {scheduleTitle}
            </h2>
            <button 
              onClick={() => navigate('/student/schedule')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {displayClasses.length > 0 ? (
              displayClasses.map((cls) => (
                <ClassItem key={cls.id} classItem={cls} />
              ))
            ) : (
              <EmptyState 
                icon={Calendar} 
                message={isToday ? "Không có lớp học nào hôm nay" : "Không có lịch học sắp tới"} 
              />
            )}
          </div>
        </div>

        {/* Right Column: Grades & Invoices (1/3 width) */}
        <div className="space-y-6">
          {/* Unpaid Invoices Alert */}
          {unpaidInvoices.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">Cần thanh toán học phí</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                        Bạn có {unpaidInvoices.length} hóa đơn chưa thanh toán.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {formatCurrency(stats.unpaidAmount)}
                      </span>
                      <button 
                        onClick={() => navigate('/student/invoices')}
                        className="text-xs font-medium bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Thanh toán ngay
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Grades */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Điểm mới nhất
              </CardTitle>
              <button 
                onClick={() => navigate('/student/grades')}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {recentGrades.length > 0 ? (
                recentGrades.slice(0, 5).map((grade) => (
                  <GradeItem key={grade.id} grade={grade} />
                ))
              ) : (
                <EmptyState icon={Award} message="Chưa có điểm nào" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;

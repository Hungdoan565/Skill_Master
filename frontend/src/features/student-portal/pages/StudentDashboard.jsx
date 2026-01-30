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
  Calendar
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

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', colorStyles[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassItem({ classItem }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{classItem.class_name || classItem.name}</p>
        <p className="text-sm text-muted-foreground">{classItem.course_name}</p>
      </div>
      <div className="text-right text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground mt-1">
          <MapPin className="h-4 w-4" />
          <span>{classItem.room_name || 'Chưa xếp phòng'}</span>
        </div>
      </div>
    </div>
  );
}

function GradeItem({ grade }) {
  const gradeColor = grade.score >= 8 ? 'text-green-600' : 
                     grade.score >= 6.5 ? 'text-blue-600' : 
                     grade.score >= 5 ? 'text-amber-600' : 'text-red-600';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{grade.class_name}</p>
        <p className="text-sm text-muted-foreground">{grade.grade_type || grade.type}</p>
      </div>
      <div className={cn('text-xl font-bold', gradeColor)}>
        {grade.score?.toFixed(1) || 'N/A'}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Icon className="h-10 w-10 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function StudentDashboard() {
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-destructive/10 rounded-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
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
  const recentGrades = data?.recentGrades || [];
  const unpaidInvoices = data?.unpaidInvoices || [];
  const studentName = data?.student?.full_name || profile?.full_name || 'Học viên';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xin chào, {studentName}!</h1>
          <p className="text-muted-foreground">Tổng quan học tập của bạn</p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Lớp đang học"
          value={stats.totalClasses || 0}
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
          value={stats.avgGrade?.toFixed(1) || 'N/A'}
          color="blue"
        />
        <StatCard
          icon={CreditCard}
          label="Công nợ"
          value={formatCurrency(stats.unpaidAmount)}
          color={stats.unpaidAmount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Two columns: Today's Classes + Recent Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Lịch học hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls) => (
                <ClassItem key={cls.id} classItem={cls} />
              ))
            ) : (
              <EmptyState icon={Calendar} message="Không có lớp học hôm nay" />
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              Điểm mới nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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

      {/* Unpaid Invoices Alert */}
      {unpaidInvoices.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Bạn có {unpaidInvoices.length} hóa đơn chưa thanh toán
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Tổng công nợ: {formatCurrency(stats.unpaidAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StudentDashboard;


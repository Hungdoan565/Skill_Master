import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  CreditCard, 
  Clock, 
  MapPin,
  AlertTriangle,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useParentChildren,
  useParentChildSchedule,
  useParentChildGrades,
  useParentChildAttendance,
  useParentChildInvoices
} from '../hooks';

// Helper formats
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const formatTime = (time) => {
  if (!time) return '--:--';
  return time.slice(0, 5);
};

// --- Tab Components ---

function ScheduleTab({ studentId }) {
  const { schedule, loading, error } = useParentChildSchedule(studentId);

  if (loading) return <div className="p-4 text-center">Đang tải lịch học...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!schedule.length) return <div className="p-8 text-center text-muted-foreground">Chưa có lịch học</div>;

  return (
    <div className="space-y-4">
      {schedule.map((cls, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">{cls.className}</h4>
                <p className="text-muted-foreground">{cls.courseTitle}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{cls.dayOfWeek === 8 ? 'Chủ nhật' : `Thứ ${cls.dayOfWeek}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{cls.roomName || 'Chưa xếp phòng'}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Status logic might need backend support or derived from dates */}
            <Badge variant={'default'}>
              Đang học
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GradesTab({ studentId }) {
  const { grades, loading, error } = useParentChildGrades(studentId);

  if (loading) return <div className="p-4 text-center">Đang tải bảng điểm...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!grades.length) return <div className="p-8 text-center text-muted-foreground">Chưa có điểm số</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {grades.map((grade, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{grade.className}</p>
                <p className="text-sm text-muted-foreground">{grade.gradeType}</p>
                <p className="text-xs text-muted-foreground mt-1">Ngày: {formatDate(grade.assessmentDate)}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-2xl font-bold",
                  grade.score >= 8 ? 'text-green-600' : 
                  grade.score >= 6.5 ? 'text-blue-600' : 
                  grade.score >= 5 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {grade.score?.toFixed(1) || 'N/A'}
                </span>
                <p className="text-xs text-muted-foreground">/ 10.0</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceTab({ studentId }) {
  const { attendance, loading, error } = useParentChildAttendance(studentId);

  if (loading) return <div className="p-4 text-center">Đang tải điểm danh...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!attendance.length) return <div className="p-8 text-center text-muted-foreground">Chưa có dữ liệu điểm danh</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {attendance.map((att, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-full",
                  att.status === 'present' ? 'bg-green-100 text-green-600' :
                  att.status === 'absent' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                )}>
                  {att.status === 'present' ? <CheckCircle className="h-5 w-5" /> : 
                   att.status === 'absent' ? <AlertTriangle className="h-5 w-5" /> : 
                   <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">{att.className}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(att.sessionDate)}</p>
                </div>
              </div>
              <div>
                <Badge variant={
                  att.status === 'present' ? 'success' :
                  att.status === 'absent' ? 'destructive' :
                  'warning'
                }>
                  {att.status === 'present' ? 'Có mặt' : 
                   att.status === 'absent' ? 'Vắng mặt' : 
                   att.status === 'late' ? 'Đi muộn' : 'Có phép'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InvoicesTab({ studentId }) {
  const { invoices, loading, error } = useParentChildInvoices(studentId);

  if (loading) return <div className="p-4 text-center">Đang tải hóa đơn...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!invoices.length) return <div className="p-8 text-center text-muted-foreground">Chưa có hóa đơn</div>;

  return (
    <div className="space-y-4">
      {invoices.map((inv) => (
        <Card key={inv.id} className={cn(
          "border-l-4",
          inv.status === 'paid' ? 'border-l-green-500' : 
          inv.status === 'overdue' ? 'border-l-red-500' : 'border-l-amber-500'
        )}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-lg">{inv.invoice_number}</h4>
                <p className="text-sm text-muted-foreground">Tạo ngày: {formatDate(inv.issue_date || inv.created_at)}</p>
              </div>
              <Badge variant={
                inv.status === 'paid' ? 'success' : 
                inv.status === 'overdue' ? 'destructive' : 'warning'
              }>
                {inv.status === 'paid' ? 'Đã thanh toán' : 
                 inv.status === 'overdue' ? 'Quá hạn' : 'Chưa thanh toán'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-end border-t pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Hạn thanh toán</p>
                <p className="font-medium">{formatDate(inv.due_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tổng tiền</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(inv.final_amount || inv.total_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Main Page Component ---

export function ParentChildDetail() {
  const { studentId } = useParams();
  const { children, loading } = useParentChildren();
  
  // Find current child from the list
  const currentChild = children.find(c => c.id === studentId || c.id === parseInt(studentId));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!currentChild) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Không tìm thấy thông tin học viên</h2>
        <Button asChild className="mt-4">
          <Link to="/parent/dashboard">Quay lại trang chủ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          to="/parent/dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Link>
        
        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 font-bold text-2xl">
            {currentChild.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{currentChild.full_name}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="font-normal">
                  {currentChild.student_code}
                </Badge>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {currentChild.center_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-6">
          <TabsTrigger value="schedule">Lịch học</TabsTrigger>
          <TabsTrigger value="grades">Điểm số</TabsTrigger>
          <TabsTrigger value="attendance">Điểm danh</TabsTrigger>
          <TabsTrigger value="invoices">Học phí</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="mt-0">
          <ScheduleTab studentId={studentId} />
        </TabsContent>
        
        <TabsContent value="grades" className="mt-0">
          <GradesTab studentId={studentId} />
        </TabsContent>
        
        <TabsContent value="attendance" className="mt-0">
          <AttendanceTab studentId={studentId} />
        </TabsContent>
        
        <TabsContent value="invoices" className="mt-0">
          <InvoicesTab studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ParentChildDetail;

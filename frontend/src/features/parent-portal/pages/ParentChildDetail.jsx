import { useState } from 'react';
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
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useParentChildren,
  useParentChildSchedule,
  useParentChildGrades,
  useParentChildAttendance,
  useParentChildInvoices
} from '../hooks';
import {
  buildParentChildDetailNavigation,
  buildParentChildOverview,
  buildParentGradesGroups,
  buildParentScheduleGroups,
  formatCurrency,
  getRelationshipTone,
} from './parent-portal-helpers';
import { formatDate, formatTime } from './parent-portal-helpers';

// --- Tab Components ---

function ScheduleTab({ studentId }) {
  const { schedule, loading, error } = useParentChildSchedule(studentId);
  const groupedSchedule = buildParentScheduleGroups(schedule);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  if (loading) return <div className="p-4 text-center">Đang tải lịch học...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!schedule.length) return <div className="p-8 text-center text-muted-foreground">Chưa có lịch học</div>;

  return (
    <div className="space-y-4">
      {groupedSchedule.map((group) => (
        <Card key={group.classId}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{group.className}</h4>
                    <p className="text-muted-foreground">{group.courseTitle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="w-fit font-normal">
                      {group.slotCountLabel}
                    </Badge>
                    <Badge variant={'default'}>
                      Đang học
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(expandedGroups[group.classId] ? group.slots : group.slots.slice(0, 3)).map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col gap-2 rounded-lg border bg-slate-50/80 px-3 py-2 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-gray-300 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>{slot.dayLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{slot.roomName}</span>
                      </div>
                    </div>
                  ))}

                  {group.slots.length > 3 && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroup(group.classId)}
                        className="h-9 rounded-lg px-3 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-950/40"
                      >
                        {expandedGroups[group.classId] ? (
                          <ChevronUp className="mr-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="mr-2 h-4 w-4" />
                        )}
                        {expandedGroups[group.classId]
                          ? 'Thu gọn lịch của học viên'
                          : `Xem thêm ${group.slots.length - 3} buổi còn lại`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GradesTab({ studentId }) {
  const { grades, loading, error } = useParentChildGrades(studentId);
  const groupedGrades = buildParentGradesGroups(grades);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  if (loading) return <div className="p-4 text-center">Đang tải bảng điểm...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!grades.length) return <div className="p-8 text-center text-muted-foreground">Chưa có điểm số</div>;

  return (
    <div className="space-y-4">
      {groupedGrades.map((group) => (
        <Card key={group.classKey}>
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-lg">{group.className}</p>
                <p className="text-sm text-muted-foreground">{group.courseTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{group.assessmentCountLabel}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{group.summaryLabel}</p>
                <div className="flex items-baseline sm:justify-end gap-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    group.summaryScore >= 8 ? 'text-green-600' :
                      group.summaryScore >= 6.5 ? 'text-blue-600' :
                        group.summaryScore >= 5 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {group.summaryScore?.toFixed?.(1) ?? group.summaryScore ?? 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 10.0</span>
                </div>
                {group.latestScore != null && (
                  <p className="mt-1 text-xs text-muted-foreground">Đầu điểm gần nhất: {group.latestScore.toFixed?.(1) ?? group.latestScore}/10</p>
                )}
              </div>
            </div>

            <div className="border-t px-4 py-3 space-y-2">
              {(expandedGroups[group.classKey] ? group.assessments : group.assessments.slice(0, 3)).map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between rounded-lg border bg-slate-50/80 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{assessment.gradeType}</p>
                    <p className="text-xs text-muted-foreground">Ngày: {formatDate(assessment.assessmentDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      "text-lg font-bold",
                      assessment.score >= 8 ? 'text-green-600' :
                        assessment.score >= 6.5 ? 'text-blue-600' :
                          assessment.score >= 5 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {assessment.score?.toFixed?.(1) ?? assessment.score ?? 'N/A'}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">/ 10.0</span>
                  </div>
                </div>
              ))}

              {group.assessments.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleGroup(group.classKey)}
                  className="h-9 rounded-lg px-3 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-950/40"
                >
                  {expandedGroups[group.classKey] ? (
                    <ChevronUp className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  {expandedGroups[group.classKey]
                    ? 'Thu gọn đầu điểm'
                    : `Xem thêm ${group.assessments.length - 3} đầu điểm`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
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
  const { children, loading, error } = useParentChildren();
  const { schedule } = useParentChildSchedule(studentId);
  const { grades } = useParentChildGrades(studentId);
  const { attendance } = useParentChildAttendance(studentId);
  const { invoices } = useParentChildInvoices(studentId);

  // Find current child from the list
  const currentChild = children.find(c => c.id === studentId || c.id === parseInt(studentId));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Không thể tải dữ liệu học viên liên kết</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild className="mt-4">
          <Link to="/parent/dashboard">Quay lại trang tổng quan</Link>
        </Button>
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

  const overview = buildParentChildOverview({
    child: currentChild,
    schedule,
    grades,
    attendance,
    invoices,
  });
  const detailNavigation = buildParentChildDetailNavigation(currentChild.full_name);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          to="/parent/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại học viên liên kết
        </Link>

        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">
          <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 font-bold text-2xl">
            {currentChild.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{currentChild.full_name}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <Badge variant="outline" className="font-normal w-fit">
                {getRelationshipTone(currentChild.relationship)}
              </Badge>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {currentChild.center_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {overview.heroMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buổi học sắp tới</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-foreground">{overview.nextSession.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{overview.nextSession.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tình hình học tập</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-foreground">{overview.academicStatus.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{overview.academicStatus.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Học phí & chuyên cần</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-foreground">{overview.financialStatus.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{overview.financialStatus.description}</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold text-foreground">{overview.attendanceStatus.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{overview.attendanceStatus.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="w-full">
        <div className="mb-4 rounded-xl border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">{detailNavigation.sectionLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detailNavigation.description}</p>
        </div>
        <TabsList className="grid w-full grid-cols-4 lg:w-[640px] mb-6">
          {detailNavigation.tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
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

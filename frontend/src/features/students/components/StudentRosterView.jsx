import { ExternalLink, GraduationCap, Layers3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CLASS_STATUS_META = {
  ongoing: { label: 'Đang diễn ra', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  upcoming: { label: 'Sắp khai giảng', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  completed: { label: 'Hoàn thành', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  cancelled: { label: 'Đã hủy', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  active: { label: 'Đang mở', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  inactive: { label: 'Tạm dừng', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  draft: { label: 'Bản nháp', className: 'border-slate-200 bg-slate-100 text-slate-700' },
};

const ENROLLMENT_STATUS_META = {
  active: { label: 'Đang học', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  pending: { label: 'Chờ xếp lớp', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  completed: { label: 'Đã hoàn thành', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  dropped: { label: 'Đã nghỉ', className: 'border-rose-200 bg-rose-50 text-rose-700' },
  inactive: { label: 'Không hoạt động', className: 'border-slate-200 bg-slate-100 text-slate-700' },
};

function getClassStatusMeta(status) {
  if (!status) return { label: 'Chưa cập nhật', className: 'border-slate-200 bg-slate-100 text-slate-700' };
  return CLASS_STATUS_META[status] || { label: status, className: 'border-slate-200 bg-slate-100 text-slate-700' };
}

function getEnrollmentStatusMeta(status) {
  if (!status) return { label: 'Chưa cập nhật', className: 'border-slate-200 bg-slate-100 text-slate-700' };
  return ENROLLMENT_STATUS_META[status] || { label: status, className: 'border-slate-200 bg-slate-100 text-slate-700' };
}

export function StudentRosterView({
  classes = [],
  courses = [],
  selectedClassId,
  selectedCourseId,
  rosterStudents = [],
  loading = false,
  onSelectClass,
  onViewStudent,
  onOpenClass,
}) {
  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const selectedCourse = courses.find((item) => item.id === selectedCourseId);
  const selectedClassStatus = getClassStatusMeta(selectedClass?.status);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-5 w-5 text-indigo-600" /> Danh sách lớp theo bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCourse && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 text-sm text-indigo-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Khóa đang xem</p>
                <p className="truncate">{selectedCourse.title || selectedCourse.name}</p>
              </div>
            )}

            {classes.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                Tìm thấy <span className="font-semibold text-slate-900">{classes.length}</span> lớp phù hợp. Chọn 1 lớp để xem roster.
              </div>
            )}

            {classes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Chưa có lớp phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="max-h-[64vh] space-y-2 overflow-y-auto pr-1">
                {classes.map((item) => {
                  const active = item.id === selectedClassId;
                  const statusMeta = getClassStatusMeta(item.status);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectClass(item.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{item.courses?.title || 'Chưa gắn khóa'}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 whitespace-nowrap px-2 py-0.5 text-[11px] leading-4 ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{item.code || 'Không mã'}</span>
                        {item.max_students ? <span>Sĩ số tối đa: {item.max_students}</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-emerald-600" /> Roster học viên
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedClass
                    ? `${selectedClass.name} • ${selectedClass.courses?.title || 'Chưa gắn khóa học'}`
                    : 'Chọn một lớp để xem danh sách học viên đang theo học'}
                </p>
              </div>

              {selectedClass && (
                <Button type="button" variant="outline" className="bg-white" onClick={() => onOpenClass?.(selectedClass.id)}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Mở trang lớp học
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!selectedClass ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500">
                <GraduationCap className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium">Chưa chọn lớp học</p>
                <p className="mt-1 text-sm">Hãy chọn một lớp ở cột bên trái để xem roster học viên.</p>
              </div>
            ) : loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                Đang tải roster...
              </div>
            ) : rosterStudents.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500">
                <Users className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium">Lớp hiện chưa có học viên</p>
                <p className="mt-1 text-sm">Bạn có thể ghi danh học viên mới hoặc chọn lớp khác để xem.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng số học viên</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{rosterStudents.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái lớp</p>
                    <div className="mt-2">
                      <Badge variant="outline" className={selectedClassStatus.className}>{selectedClassStatus.label}</Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sức chứa tối đa</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{selectedClass.max_students || '—'}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Học viên</th>
                        <th className="px-4 py-3 font-semibold">Liên hệ</th>
                        <th className="px-4 py-3 font-semibold">Trạng thái ghi danh</th>
                        <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterStudents.map((student) => {
                        const enrollmentMeta = getEnrollmentStatusMeta(student.enrollment_status);

                        return (
                          <tr key={student.id} className="border-t border-slate-100 bg-white">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{student.full_name}</p>
                              <p className="text-xs text-slate-500">{student.email || 'Chưa có email'}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{student.phone || 'Chưa cập nhật'}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={enrollmentMeta.className}>
                                {enrollmentMeta.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button type="button" variant="ghost" size="sm" onClick={() => onViewStudent?.(student)}>
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

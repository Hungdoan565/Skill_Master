import { ExternalLink, GraduationCap, Layers3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CLASS_STATUS_META = {
  ongoing: { label: 'Đang diễn ra', className: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  upcoming: { label: 'Sắp khai giảng', className: 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' },
  completed: { label: 'Hoàn thành', className: 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
  cancelled: { label: 'Đã hủy', className: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' },
  active: { label: 'Đang mở', className: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  inactive: { label: 'Tạm dừng', className: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
  draft: { label: 'Bản nháp', className: 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-400' },
};

const ENROLLMENT_STATUS_META = {
  active: { label: 'Đang học', className: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  pending: { label: 'Chờ xếp lớp', className: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
  completed: { label: 'Đã hoàn thành', className: 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
  dropped: { label: 'Đã nghỉ', className: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' },
  inactive: { label: 'Không hoạt động', className: 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-400' },
};

function getClassStatusMeta(status) {
  if (!status) return { label: 'Chưa cập nhật', className: 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-400' };
  return CLASS_STATUS_META[status] || { label: status, className: 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-400' };
}

function getEnrollmentStatusMeta(status) {
  if (!status) return { label: 'Chưa cập nhật', className: 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-400' };
  return ENROLLMENT_STATUS_META[status] || { label: status, className: 'border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-400' };
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
        <Card className="bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-5 w-5 text-indigo-600" /> Danh sách lớp theo bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCourse && (
              <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-2.5 text-sm text-indigo-900 dark:text-indigo-300">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">Khóa đang xem</p>
                <p className="truncate">{selectedCourse.title || selectedCourse.name}</p>
              </div>
            )}

            {classes.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-2.5 text-xs text-slate-600 dark:text-gray-400">
                Tìm thấy <span className="font-semibold text-slate-900 dark:text-gray-200">{classes.length}</span> lớp phù hợp. Chọn 1 lớp để xem roster.
              </div>
            )}

            {classes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-4 text-sm text-slate-500 dark:text-gray-400">
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
                          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                          : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-gray-100">{item.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-gray-400">{item.courses?.title || 'Chưa gắn khóa'}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 whitespace-nowrap px-2 py-0.5 text-[11px] leading-4 ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-gray-400">
                        <span className="rounded bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 font-medium text-slate-600 dark:text-gray-300">{item.code || 'Không mã'}</span>
                        {item.max_students ? <span>Sĩ số tối đa: {item.max_students}</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-emerald-600" /> Roster học viên
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                  {selectedClass
                    ? `${selectedClass.name} • ${selectedClass.courses?.title || 'Chưa gắn khóa học'}`
                    : 'Chọn một lớp để xem danh sách học viên đang theo học'}
                </p>
              </div>

              {selectedClass && (
                <Button type="button" variant="outline" className="bg-white dark:bg-gray-800" onClick={() => onOpenClass?.(selectedClass.id)}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Mở trang lớp học
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!selectedClass ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-center text-slate-500 dark:text-gray-400">
                <GraduationCap className="mb-3 h-10 w-10 text-slate-300 dark:text-gray-600" />
                <p className="font-medium">Chưa chọn lớp học</p>
                <p className="mt-1 text-sm">Hãy chọn một lớp ở cột bên trái để xem roster học viên.</p>
              </div>
            ) : loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400">
                Đang tải roster...
              </div>
            ) : rosterStudents.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-center text-slate-500 dark:text-gray-400">
                <Users className="mb-3 h-10 w-10 text-slate-300 dark:text-gray-600" />
                <p className="font-medium">Lớp hiện chưa có học viên</p>
                <p className="mt-1 text-sm">Bạn có thể ghi danh học viên mới hoặc chọn lớp khác để xem.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Tổng số học viên</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-gray-100">{rosterStudents.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Trạng thái lớp</p>
                    <div className="mt-2">
                      <Badge variant="outline" className={selectedClassStatus.className}>{selectedClassStatus.label}</Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Sức chứa tối đa</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-gray-100">{selectedClass.max_students || '—'}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-gray-800 text-left text-slate-600 dark:text-gray-400">
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
                          <tr key={student.id} className="border-t border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 dark:text-gray-100">{student.full_name}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">{student.email || 'Chưa có email'}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-gray-400">{student.phone || 'Chưa cập nhật'}</td>
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

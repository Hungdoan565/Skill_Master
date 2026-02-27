import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';

export function EnrollmentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  submitting,
  selectedStudents,
  selectedClass,
}) {
  if (!selectedClass) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const studentCount = selectedStudents.length;
  const currentEnrolled = selectedClass.enrolled_count || 0;
  const newEnrolledCount = currentEnrolled + studentCount;
  const maxStudents = selectedClass.max_students || 0;
  const remainingSpots = maxStudents - newEnrolledCount;
  const isAlmostFull = maxStudents > 0 && remainingSpots <= Math.ceil(maxStudents * 0.1);

  const tuitionFee = selectedClass.courses?.tuition_fee || 0;
  const totalTuition = tuitionFee * studentCount;

  const teacherName =
    selectedClass.teacher?.full_name ||
    selectedClass.teachers?.full_name ||
    selectedClass.users?.full_name ||
    'Chưa phân công';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !submitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-6 w-6 text-indigo-600" />
            Xác nhận ghi danh
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
          {/* Section 1 - Class info card */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-indigo-900">{selectedClass.name}</h3>
                <p className="text-sm text-indigo-700">{selectedClass.courses?.title || 'N/A'}</p>
              </div>
              <Badge variant={isAlmostFull ? 'destructive' : 'success'}>
                Còn {remainingSpots} chỗ
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-indigo-600/80">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                GV: {teacherName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {formatDate(selectedClass.start_date)} - {formatDate(selectedClass.end_date)}
              </span>
            </div>
          </div>

          {/* Warnings */}
          {isAlmostFull && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>Lớp sắp đầy sau ghi danh này</span>
            </div>
          )}

          {/* Section 2 - Student list */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">
              Danh sách học viên ({studentCount})
            </h4>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
              {selectedStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 border border-slate-100 bg-slate-50 rounded-lg">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold bg-slate-200 text-slate-600 flex-shrink-0">
                    {getInitials(student.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 - Tuition breakdown */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm text-green-800">
              <span>Học phí mỗi học viên:</span>
              <span className="font-medium">{formatCurrency(tuitionFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-800">
              <span>Số học viên:</span>
              <span className="font-medium">{studentCount}</span>
            </div>
            <hr className="border-green-200 my-2" />
            <div className="flex justify-between items-center text-green-900">
              <span className="font-semibold">Tổng ước tính:</span>
              <span className="text-lg font-bold">{formatCurrency(totalTuition)}</span>
            </div>
            <p className="text-xs text-green-600/80 text-center mt-2 italic">
              Hóa đơn sẽ được tạo ở trạng thái Draft
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận ghi danh'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * TrialEnrollmentModal Component
 * 
 * Modal để đăng ký học thử cho học viên
 * ✅ Uses React Hook Form + Zod validation
 * ✅ Student/Class search with autocomplete
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useEnrollments } from '../hooks';
import { gooeyToast } from 'goey-toast';

export function TrialEnrollmentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedClassId = null,
}) {
  const { fetchStudents, fetchClasses, createTrialEnrollment, loading } = useEnrollments();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: preselectedClassId || '',
    notes: '',
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Load students and classes on mount
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Set preselected class
  useEffect(() => {
    if (preselectedClassId && classes.length > 0) {
      const cls = classes.find(c => c.id === preselectedClassId);
      if (cls) {
        setSelectedClass(cls);
        setFormData(prev => ({ ...prev, class_id: cls.id }));
      }
    }
  }, [preselectedClassId, classes]);

  const loadInitialData = async () => {
    const [studentsData, classesData] = await Promise.all([
      fetchStudents(),
      fetchClasses()
    ]);
    setStudents(studentsData || []);
    setClasses(classesData || []);
  };

  // Search students with debounce
  const handleStudentSearch = useCallback(async (search) => {
    setStudentSearch(search);
    if (search.length >= 2) {
      const result = await fetchStudents(null, search);
      setStudents(result || []);
    }
  }, [fetchStudents]);

  // Handle student selection
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, student_id: student.id }));
    setStudentPopoverOpen(false);
  };

  // Handle class selection
  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setFormData(prev => ({ ...prev, class_id: cls.id }));
    setClassPopoverOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.student_id) {
      gooeyToast.error('Vui lòng chọn học viên');
      return;
    }
    if (!formData.class_id) {
      gooeyToast.error('Vui lòng chọn lớp học');
      return;
    }

    try {
      setSubmitting(true);
      const result = await createTrialEnrollment(formData);
      gooeyToast.success(result.message || 'Đã đăng ký học thử thành công');
      onSuccess?.();
      handleClose();
    } catch (error) {
      gooeyToast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({ student_id: '', class_id: preselectedClassId || '', notes: '' });
    setSelectedStudent(null);
    setSelectedClass(null);
    setStudentSearch('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-500" />
            Đăng ký học thử
          </DialogTitle>
          <DialogDescription>
            Tạo đăng ký học thử miễn phí. Thời hạn: 3 ngày từ khi đăng ký.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Học viên <span className="text-red-500">*</span></Label>
            <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedStudent ? (
                    <span>{selectedStudent.full_name} ({selectedStudent.email})</span>
                  ) : (
                    <span className="text-muted-foreground">Chọn học viên...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Tìm theo tên hoặc email..." 
                    value={studentSearch}
                    onValueChange={handleStudentSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy học viên</CommandEmpty>
                    <CommandGroup>
                      {students.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={student.id}
                          onSelect={() => handleSelectStudent(student)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{student.full_name}</span>
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Lớp học <span className="text-red-500">*</span></Label>
            <Popover open={classPopoverOpen} onOpenChange={setClassPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  disabled={!!preselectedClassId}
                >
                  {selectedClass ? (
                    <span>{selectedClass.name} ({selectedClass.code})</span>
                  ) : (
                    <span className="text-muted-foreground">Chọn lớp học...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Tìm theo tên lớp..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy lớp học</CommandEmpty>
                    <CommandGroup>
                      {classes.map((cls) => (
                        <CommandItem
                          key={cls.id}
                          value={cls.id}
                          onSelect={() => handleSelectClass(cls)}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cls.name}</span>
                              <Badge variant="outline" className="text-xs">{cls.code}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {cls.course?.title || 'N/A'} • {cls.current_students || 0}/{cls.max_students} học viên
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              placeholder="Ghi chú về đăng ký học thử..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>📝 Lưu ý:</strong>
            </p>
            <ul className="text-xs text-amber-700 mt-1 space-y-1">
              <li>• Học thử miễn phí, không tạo hóa đơn</li>
              <li>• Tự động hết hạn sau 3 ngày</li>
              <li>• Có thể chuyển đổi thành đăng ký chính thức</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Đăng ký học thử
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TrialEnrollmentModal;

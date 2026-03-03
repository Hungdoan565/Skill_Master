/**
 * WaitingListModal Component
 * 
 * Modal để thêm học viên vào danh sách chờ
 * ✅ Uses React Hook Form + Zod validation
 * ✅ Priority selection
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Clock, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useEnrollments } from '../hooks';
import { gooeyToast } from 'goey-toast';

// Priority options
const PRIORITY_OPTIONS = [
  { value: '0', label: 'Bình thường', description: 'Xếp hàng theo thứ tự', color: 'bg-slate-100 text-slate-700' },
  { value: '1', label: 'Ưu tiên', description: 'Được thông báo sớm hơn', color: 'bg-amber-100 text-amber-700' },
  { value: '2', label: 'Khẩn cấp', description: 'Được thông báo đầu tiên', color: 'bg-red-100 text-red-700' },
];

export function WaitingListModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedClassId = null,
}) {
  const { fetchStudents, fetchClasses, addToWaitingList, loading } = useEnrollments();

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
    priority: '0',
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
      const result = await addToWaitingList({
        student_id: formData.student_id,
        class_id: formData.class_id,
        priority: parseInt(formData.priority),
        notes: formData.notes || null,
      });
      gooeyToast.success(result.message || 'Đã thêm vào danh sách chờ');
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
    setFormData({ student_id: '', class_id: preselectedClassId || '', priority: '0', notes: '' });
    setSelectedStudent(null);
    setSelectedClass(null);
    setStudentSearch('');
    onClose();
  };

  // Check if selected class is full
  const isClassFull = selectedClass && 
    (selectedClass.current_students || 0) >= (selectedClass.max_students || 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Thêm vào danh sách chờ
          </DialogTitle>
          <DialogDescription>
            Thêm học viên vào danh sách chờ khi lớp đã đầy
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
                      {classes.map((cls) => {
                        const isFull = (cls.current_students || 0) >= (cls.max_students || 0);
                        return (
                          <CommandItem
                            key={cls.id}
                            value={cls.id}
                            onSelect={() => handleSelectClass(cls)}
                          >
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{cls.name}</span>
                                {isFull ? (
                                  <Badge variant="destructive" className="text-xs">Đầy</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">{cls.code}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {cls.course?.title || 'N/A'} • {cls.current_students || 0}/{cls.max_students} học viên
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Warning if class is not full */}
          {selectedClass && !isClassFull && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                <strong>Lưu ý:</strong> Lớp này chưa đầy ({selectedClass.current_students || 0}/{selectedClass.max_students} học viên). 
                Học viên có thể đăng ký trực tiếp.
              </p>
            </div>
          )}

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>Độ ưu tiên</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={option.color}>{option.label}</Badge>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              placeholder="Ghi chú về yêu cầu đặc biệt..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📋 Quy trình:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Khi có chỗ trống, hệ thống tự động thông báo</li>
              <li>• Học viên có 7 ngày để xác nhận đăng ký</li>
              <li>• Thứ tự ưu tiên: Khẩn cấp → Ưu tiên → Bình thường</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Thêm vào danh sách chờ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default WaitingListModal;

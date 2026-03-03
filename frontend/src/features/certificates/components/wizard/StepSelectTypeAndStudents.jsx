import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { Search, CheckCircle, XCircle, AlertTriangle, AlertCircle, CheckSquare, SearchX, Check, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCertificateTypes } from '../../hooks/useCertificateTypes';
import { CATEGORY_CONFIG } from '../../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

export default function StepSelectTypeAndStudents({ form, onStudentsLoaded }) {
  const { certificateTypes, fetchCertificateTypes, loading: loadingTypes } = useCertificateTypes();
  const [searchType, setSearchType] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const selectedTypeId = form.watch('certificateTypeId');
  const selectedStudentIds = form.watch('studentIds') || [];
  const overrideReasons = form.watch('overrideReasons') || {};

  useEffect(() => {
    fetchCertificateTypes({ is_internal: true });
  }, [fetchCertificateTypes]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedTypeId) {
        setStudents([]);
        if (onStudentsLoaded) onStudentsLoaded([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(
          `${API_URL}/api/admin/certificates/eligible-students?type_id=${selectedTypeId}`,
          { headers }
        );
        if (response.data?.success) {
          const list = response.data.data || [];
          setStudents(list);
          if (onStudentsLoaded) onStudentsLoaded(list);
        } else {
          setStudents([]);
          if (onStudentsLoaded) onStudentsLoaded([]);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách học viên', error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [selectedTypeId]);

  const handleTypeSelect = (typeId) => {
    form.setValue('certificateTypeId', typeId, { shouldValidate: true });
    form.setValue('studentIds', []);
    form.setValue('overrideReasons', {});
    form.setValue('scores', {});
  };

  const toggleStudent = (studentId, isEligible) => {
    const newSelected = [...selectedStudentIds];
    const index = newSelected.indexOf(studentId);
    if (index > -1) {
      newSelected.splice(index, 1);
      const newReasons = { ...overrideReasons };
      delete newReasons[studentId];
      form.setValue('overrideReasons', newReasons);
    } else {
      newSelected.push(studentId);
    }
    form.setValue('studentIds', newSelected, { shouldValidate: true });
  };

  const handleReasonChange = (studentId, value) => {
    form.setValue('overrideReasons', {
      ...overrideReasons,
      [studentId]: value
    });
  };

  const selectAllEligible = () => {
    const eligibleIds = students.filter(s => s.is_eligible).map(s => s.student_id);
    const newSelected = [...new Set([...selectedStudentIds, ...eligibleIds])];
    form.setValue('studentIds', newSelected, { shouldValidate: true });
  };

  const groupedTypes = certificateTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {});

  Object.keys(groupedTypes).forEach(category => {
    groupedTypes[category] = groupedTypes[category].filter(t => 
      t.name.toLowerCase().includes(searchType.toLowerCase())
    );
    if (groupedTypes[category].length === 0) delete groupedTypes[category];
  });

  const filteredStudents = students.filter(s => {
    const name = s.student_name || s.full_name || '';
    const cName = s.class_name || s.class_code || '';
    return name.toLowerCase().includes(searchStudent.toLowerCase()) ||
           cName.toLowerCase().includes(searchStudent.toLowerCase());
  });

  const getInitials = (name) => {
    if (!name) return 'HV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[500px]">
      {/* LEFT PANEL: Certificate Types */}
      <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-white shadow-sm h-full">
        <div className="p-4 border-b border-border bg-muted shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="font-semibold text-foreground">Chọn loại chứng chỉ</h3>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm loại chứng chỉ..."
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="pl-9 bg-white border-border focus-visible:ring-primary/20 shadow-sm"
            />
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {loadingTypes ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground animate-pulse">Đang tải danh sách...</div>
          ) : Object.keys(groupedTypes).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-40">
              <SearchX className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Không tìm thấy chứng chỉ nội bộ nào</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTypes).map(([category, types]) => {
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                const Icon = config.icon;
                
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{config.label}</span>
                    </div>
                    <div className="grid gap-3">
                      {types.map(type => {
                        const isSelected = selectedTypeId === type.id;
                        return (
                          <div
                            key={type.id}
                            onClick={() => handleTypeSelect(type.id)}
                            className={cn(
                              "relative p-4 rounded-xl cursor-pointer transition-all duration-200 border group overflow-hidden",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" 
                                : "border-border bg-white hover:border-primary/50 hover:bg-muted shadow-sm hover:shadow-md"
                            )}
                          >
                            {isSelected && (
                              <div className="absolute top-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-bl-xl flex items-center justify-center shadow-sm">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-all duration-300", isSelected ? "bg-primary" : "bg-transparent group-hover:bg-primary/30")} />
                            <div className="pl-2">
                              <div className={cn("font-semibold text-base mb-1 transition-colors", isSelected ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                {type.name}
                              </div>
                              {type.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{type.description}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {form.formState.errors.certificateTypeId && (
          <div className="p-3 px-4 bg-destructive/10 text-destructive text-sm font-medium border-t border-destructive/20 flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {form.formState.errors.certificateTypeId.message}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Eligible Students */}
      <div className={cn(
        "flex flex-col border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-500 h-full bg-white",
        selectedTypeId ? "opacity-100 ring-1 ring-border" : "opacity-50 grayscale pointer-events-none"
      )}>
        <div className="p-4 border-b border-border bg-muted shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <h3 className="font-semibold text-foreground">Chọn học viên</h3>
            </div>
            {selectedTypeId && students.filter(s => s.is_eligible).length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllEligible}
                className="text-xs h-7 border-primary/20 text-primary hover:bg-primary/10 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Chọn tất cả đủ Đ/K
              </Button>
            )}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Tìm theo tên học viên, lớp học..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="pl-9 bg-white border-border focus-visible:ring-primary/20 shadow-sm"
              disabled={!selectedTypeId}
            />
          </div>
        </div>

        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
          {!selectedTypeId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                <SearchX className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">Vui lòng chọn loại chứng chỉ ở cột bên trái</p>
            </div>
          ) : loadingStudents ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Đang tìm danh sách học viên...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-40">
              <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Không có học viên nào trong hệ thống</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground font-medium">Không tìm thấy học viên phù hợp</div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredStudents.map(student => {
                const isSelected = selectedStudentIds.includes(student.student_id);
                const showOverride = isSelected && !student.is_eligible;
                const name = student.student_name || student.full_name || 'Học viên ẩn danh';
                
                return (
                  <div key={`${student.student_id}_${student.class_id}`} className={cn(
                    "p-4 transition-all duration-200 border-l-4",
                    isSelected ? "bg-muted border-l-primary" : "hover:bg-muted border-l-transparent"
                  )}>
                    <div className="flex gap-4 items-start">
                      <Checkbox
                        id={`student-${student.student_id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleStudent(student.student_id, student.is_eligible)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={`student-${student.student_id}`}
                          className="flex items-start justify-between cursor-pointer gap-3 w-full"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                              {getInitials(name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate">{name}</div>
                              <div className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                                {student.class_name || student.class_code || 'Không có lớp'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="shrink-0 pt-0.5">
                            {student.is_eligible ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 font-medium shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Đủ Đ/K
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 font-medium shadow-sm">
                                <XCircle className="w-3.5 h-3.5" />
                                {student.ineligible_reason || 'Không đủ Đ/K'}
                              </Badge>
                            )}
                          </div>
                        </label>
                        
                        {/* Override reason input if ineligible but selected */}
                        {showOverride && (
                          <div className="mt-4 pl-14 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-sm relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                              <div className="text-xs text-amber-600 flex items-center gap-1.5 mb-2 font-bold uppercase tracking-wider">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Yêu cầu duyệt ngoại lệ:
                              </div>
                              <Input
                                size="sm"
                                placeholder="Vui lòng giải trình chi tiết lý do duyệt ngoại lệ..."
                                value={overrideReasons[student.student_id] || ''}
                                onChange={(e) => handleReasonChange(student.student_id, e.target.value)}
                                className={cn(
                                  "h-9 text-sm bg-white border-border focus-visible:ring-amber-500",
                                  !overrideReasons[student.student_id] ? "border-amber-400 focus-visible:ring-amber-500 bg-amber-500/5 shadow-sm" : ""
                                )}
                              />
                              {(!overrideReasons[student.student_id]) && (
                                <p className="text-xs font-semibold text-amber-600 mt-1.5 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Phải nhập lý do để Admin có cơ sở duyệt
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {form.formState.errors.studentIds && (
          <div className="p-3 px-4 bg-destructive/10 text-destructive text-sm font-medium border-t border-destructive/20 flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {form.formState.errors.studentIds.message}
          </div>
        )}
      </div>
    </div>
  );
}

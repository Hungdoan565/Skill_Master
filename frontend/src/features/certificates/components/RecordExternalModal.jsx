import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { gooeyToast } from 'goey-toast';
import { X, Upload, FileText, AlertCircle, Loader2, Calendar, Check, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { recordExternalSchema } from '../schemas';
import { useCertificateTypes } from '../hooks/useCertificateTypes';
import { GRADE_OPTIONS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RecordExternalModal({ open, onOpenChange, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState(null);
  
  const { certificateTypes, fetchCertificateTypes } = useCertificateTypes();

  const methods = useForm({
    resolver: zodResolver(recordExternalSchema),
    defaultValues: {
      studentId: '',
      certificateTypeId: '',
      externalId: '',
      examDate: '',
      scores: {},
      externalVerifyUrl: '',
      fileUrl: '',
      notes: ''
    },
    mode: 'onChange'
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = methods;

  useEffect(() => {
    if (open) {
      reset();
      setFileToUpload(null);
      setUploadProgress(0);
      fetchCertificateTypes({ is_external: true });
      fetchStudents();
    }
  }, [open, fetchCertificateTypes, reset]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/students?limit=1000`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.data?.success) {
        setStudents(response.data.data.students || response.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải học viên', error);
      gooeyToast.error('Không thể tải danh sách học viên');
    } finally {
      setLoadingStudents(false);
    }
  };

  const selectedTypeId = watch('certificateTypeId');
  const selectedType = certificateTypes.find(t => t.id === selectedTypeId);
  const examDate = watch('examDate');

  const calculateExpiry = () => {
    if (!selectedType || !selectedType.validity_months || !examDate) return null;
    const date = new Date(examDate);
    date.setMonth(date.getMonth() + selectedType.validity_months);
    return date.toLocaleDateString('vi-VN');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      gooeyToast.error('Kích thước file không được vượt quá 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      gooeyToast.error('Chỉ chấp nhận file .jpg, .png, .pdf');
      return;
    }

    setFileToUpload(file);
    setValue('fileUrl', '');
  };

  const uploadFileToSupabase = async (file) => {
    try {
      setUploadProgress(10);
      const fileExt = file.name.split('.').pop();
      const fileName = `external_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `certificates/external/${fileName}`;

      setUploadProgress(50);
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(80);
      const { data: publicUrlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Lỗi khi tải file lên hệ thống');
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const submitPromise = (async () => {
        let finalFileUrl = data.fileUrl;

        if (fileToUpload) {
          finalFileUrl = await uploadFileToSupabase(fileToUpload);
          setValue('fileUrl', finalFileUrl);
        }

        const { data: { session } } = await supabase.auth.getSession();

        const payload = {
          student_id: data.studentId,
          certificate_type_id: data.certificateTypeId,
          external_id: data.externalId,
          exam_date: data.examDate,
          scores: data.scores,
          external_verify_url: data.externalVerifyUrl || null,
          file_url: finalFileUrl || null,
          notes: data.notes || null,
          is_external: true
        };

        const response = await axios.post(
          `${API_URL}/api/admin/certificates`,
          payload,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Có lỗi xảy ra khi ghi nhận');
        }

        return response.data;
      })();

      await gooeyToast.promise(submitPromise, {
        loading: 'Đang ghi nhận chứng chỉ...',
        success: 'Đã ghi nhận chứng chỉ quốc tế',
        error: 'Lỗi khi ghi nhận'
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Lỗi khi lưu chứng chỉ:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderScoreInputs = () => {
    if (!selectedType || !selectedType.score_config) return null;
    const { type, sub_scores, max_score } = selectedType.score_config;

    if (type === 'grade') {
      return (
        <div className="bg-muted p-5 rounded-lg border border-border shadow-sm">
          <label className="text-sm font-semibold text-foreground mb-3 block">Xếp loại <span className="text-destructive">*</span></label>
          <Controller
            control={control}
            name="scores.grade"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Chọn xếp loại..." />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      );
    }

    if (type === 'band') {
      return (
        <div className="bg-muted p-5 rounded-lg border border-border space-y-5 shadow-sm">
          <div>
            <label className="text-sm font-semibold text-primary mb-2 block">Overall Band <span className="text-destructive">*</span></label>
            <Controller
              control={control}
              name="scores.overall"
              render={({ field }) => (
                <Input 
                  type="number" step="0.5" min="0" max="9" placeholder="VD: 6.5"
                  {...field} value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="bg-background border-border w-full md:w-1/3"
                />
              )}
            />
          </div>
          {sub_scores && sub_scores.length > 0 && (
            <div className="pt-3 border-t border-primary/10">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Điểm thành phần</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sub_scores.map(skill => (
                  <div key={skill}>
                    <label className="text-xs font-medium text-foreground capitalize mb-1.5 block">{skill}</label>
                    <Controller
                      control={control}
                      name={`scores.${skill}`}
                      render={({ field }) => (
                        <Input 
                          type="number" step="0.5" min="0" max="9" placeholder="0.0"
                          {...field} value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-background border-border"
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (type === 'numeric') {
      return (
        <div className="bg-muted p-5 rounded-lg border border-border space-y-5 shadow-sm">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
              Tổng điểm
              {max_score && <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Tối đa {max_score}</span>}
              <span className="text-destructive">*</span>
            </label>
            <Controller
              control={control}
              name="scores.total"
              render={({ field }) => (
                <Input 
                  type="number" min="0" max={max_score} placeholder="Nhập điểm số"
                  {...field} value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="bg-background border-border w-full md:w-1/3"
                />
              )}
            />
          </div>
          {sub_scores && sub_scores.length > 0 && (
            <div className="pt-3 border-t border-border">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Điểm thành phần</label>
              <div className="grid grid-cols-2 gap-4">
                {sub_scores.map(skill => (
                  <div key={skill} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-background p-2 rounded-md border border-border">
                    <label className="text-sm font-medium text-foreground capitalize sm:w-24 shrink-0 px-1">{skill}</label>
                    <Controller
                      control={control}
                      name={`scores.subScores.${skill}`}
                      render={({ field }) => (
                        <Input 
                          type="number" min="0" placeholder="0"
                          {...field} value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          className="bg-background border-border/50 shadow-none h-8"
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen === true) return;
      if (!submitting) onOpenChange(false);
    }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-border shadow-2xl">
        <div className="p-6 border-b border-border bg-white dark:bg-zinc-950 shrink-0">
          <DialogHeader className="mb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                Ghi nhận chứng chỉ quốc tế
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-zinc-950">
          <form id="record-external-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">1</span>
                Thông tin chung
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Học viên <span className="text-destructive">*</span></label>
                  <Controller
                    control={control}
                    name="studentId"
                    render={({ field, fieldState }) => (
                      <div>
                        <Select value={field.value} onValueChange={field.onChange} disabled={loadingStudents}>
                          <SelectTrigger className={cn("w-full bg-background border-border", fieldState.error && "border-destructive focus:ring-destructive/20")}>
                            <SelectValue placeholder={loadingStudents ? "Đang tải..." : "Chọn học viên..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map(s => (
                              <SelectItem key={s.id || s.student_id} value={s.id || s.student_id}>
                                {s.full_name || s.student_name} {(s.class_name || s.class_code) ? `(${s.class_name || s.class_code})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && <p className="text-[10px] text-destructive mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Loại chứng chỉ <span className="text-destructive">*</span></label>
                  <Controller
                    control={control}
                    name="certificateTypeId"
                    render={({ field, fieldState }) => (
                      <div>
                        <Select value={field.value} onValueChange={(val) => {
                          field.onChange(val);
                          setValue('scores', {});
                        }}>
                          <SelectTrigger className={cn("w-full bg-background border-border", fieldState.error && "border-destructive focus:ring-destructive/20")}>
                            <SelectValue placeholder="Chọn loại chứng chỉ..." />
                          </SelectTrigger>
                          <SelectContent>
                            {certificateTypes.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && <p className="text-[10px] text-destructive mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>

              {selectedType?.validity_months && examDate && (
                <div className="p-4 bg-primary/5 text-primary text-sm rounded-lg flex items-center gap-3 border border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <Calendar className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="block font-medium mb-0.5">Thời hạn {selectedType.validity_months} tháng</span>
                    <span className="text-primary/80">Hết hạn vào: <strong className="font-semibold text-primary">{calculateExpiry()}</strong></span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mã chứng chỉ (External ID) <span className="text-destructive">*</span></label>
                  <Controller
                    control={control}
                    name="externalId"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input {...field} placeholder="VD: 001234567" className={cn("bg-background border-border", fieldState.error && "border-destructive focus-visible:ring-destructive/20")} />
                        {fieldState.error && <p className="text-[10px] text-destructive mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ngày thi/Cấp <span className="text-destructive">*</span></label>
                  <Controller
                    control={control}
                    name="examDate"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input type="date" {...field} className={cn("bg-background border-border", fieldState.error && "border-destructive focus-visible:ring-destructive/20")} />
                        {fieldState.error && <p className="text-[10px] text-destructive mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {selectedTypeId && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">2</span>
                  Điểm số & Kết quả
                </h3>
                {renderScoreInputs()}
                {errors.scores && <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Vui lòng kiểm tra lại điểm số</p>}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">3</span>
                Đính kèm (Tùy chọn)
              </h3>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bản scan chứng chỉ</label>
                  <div className="relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/50 bg-muted hover:bg-accent transition-colors rounded-xl p-6 text-center">
                    <Input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        {fileToUpload ? (
                          <div className="text-sm font-medium text-emerald-500 flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> {fileToUpload.name}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-foreground">Kéo thả file hoặc nhấn để tải lên</p>
                            <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG, PDF tối đa 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden border border-border">
                      <div className="bg-primary h-2 rounded-full transition-all duration-300 relative" style={{ width: `${uploadProgress}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">URL Xác thực trực tuyến</label>
                  <Controller
                    control={control}
                    name="externalVerifyUrl"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input {...field} placeholder="https://..." className={cn("bg-background border-border", fieldState.error && "border-destructive")} />
                        {fieldState.error && <p className="text-[10px] text-destructive mt-1.5 font-medium"><AlertCircle className="w-3 h-3 inline mr-1" /> {fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Ghi chú</label>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field }) => (
                      <Textarea {...field} placeholder="Thêm thông tin ghi chú..." className="resize-none h-24 bg-background border-border" />
                    )}
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-zinc-50 dark:bg-zinc-900 shrink-0 px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-border bg-background hover:bg-muted">
            Hủy bỏ
          </Button>
          <Button 
            type="submit" 
            form="record-external-form" 
            disabled={submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px] shadow-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Ghi nhận
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

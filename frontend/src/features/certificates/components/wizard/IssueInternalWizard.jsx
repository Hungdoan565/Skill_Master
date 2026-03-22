import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { gooeyToast } from 'goey-toast';
import { Check, ChevronRight, X, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

import { issuanceWizardSchema } from '../../schemas';
import { useCertificateTypes } from '../../hooks/useCertificateTypes';
import StepSelectTypeAndStudents from './StepSelectTypeAndStudents';
import StepScoreInput from './StepScoreInput';
import StepPreviewAndConfirm from './StepPreviewAndConfirm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STEPS = [
  { id: 0, title: 'Chọn loại & học viên' },
  { id: 1, title: 'Nhập điểm' },
  { id: 2, title: 'Xem trước & Cấp' }
];

export default function IssueInternalWizard({ open, onOpenChange, onSuccess, centerInfo }) {
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  const { certificateTypes, fetchCertificateTypes } = useCertificateTypes();

  const methods = useForm({
    resolver: zodResolver(issuanceWizardSchema),
    defaultValues: {
      certificateTypeId: '',
      studentIds: [],
      overrideReasons: {},
      scores: {},
      showQR: true,
      showSerial: true,
      sendEmail: true,
    },
    mode: 'onChange'
  });

  const { handleSubmit, trigger, watch, reset, formState: { errors } } = methods;

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setStudentsList([]);
      reset({
        certificateTypeId: '',
        studentIds: [],
        overrideReasons: {},
        scores: {},
        showQR: true,
        showSerial: true,
        sendEmail: true,
      });
      fetchCertificateTypes();
    }
  }, [open, reset, fetchCertificateTypes]);

  const handleClose = (isOpen) => {
    if (isOpen === true) return;
    const hasStudents = watch('studentIds').length > 0;
    const isAdvancedStep = activeStep > 0;
    if (hasStudents || isAdvancedStep) {
      setShowCloseConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
  };

  const handleNext = async () => {
    let isValid = false;
    
    if (activeStep === 0) {
      isValid = await trigger(['certificateTypeId', 'studentIds']);
    } else if (activeStep === 1) {
      isValid = await trigger(['scores']);
      
      const selectedIds = watch('studentIds') || [];
      const scores = watch('scores') || {};
      const missingScores = selectedIds.some(id => !scores[id] || Object.keys(scores[id]).length === 0);
      
      if (missingScores) {
        gooeyToast.error('Vui lòng nhập điểm cho tất cả học viên được chọn');
        isValid = false;
      }
    }

    if (isValid) {
      setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const onValidationError = (errors) => {
    console.error('Form validation errors:', errors);
    const firstError = Object.values(errors)[0];
    const message = firstError?.message || firstError?.root?.message || 'Dữ liệu không hợp lệ';
    gooeyToast.error(`Lỗi validation: ${message}`);
  };
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const issuePromise = (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Chưa đăng nhập');

        const payload = {
          certificate_type_id: data.certificateTypeId,
          students: data.studentIds.map(studentId => {
            const studentData = studentsList.find(s => s.student_id === studentId);
            return {
              student_id: studentId,
              scores: data.scores[studentId],
              override_reason: data.overrideReasons[studentId] || null,
              class_id: studentData?.class_id || null,
              course_name: studentData?.course_name || null
            };
          }),
          options: {
            show_qr: data.showQR,
            show_serial: data.showSerial,
            send_email: data.sendEmail
          }
        };

        const response = await axios.post(
          `${API_URL}/api/admin/certificates/request-approval`,
          payload,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Có lỗi xảy ra khi cấp chứng chỉ');
        }

        const successCount = response.data?.data?.success?.length || 0;
        if (successCount === 0) {
          throw new Error('Không có chứng chỉ nào được cấp');
        }

        return {
          successCount,
          failedCount: response.data?.data?.failed?.length || 0
        };
      })();

      const issueResult = await gooeyToast.promise(issuePromise, {
        loading: 'Đang cấp chứng chỉ...',
        success: (result) => ({
          message: 'Đã cấp chứng chỉ thành công',
          description: `Thành công: ${result.successCount}, Thất bại: ${result.failedCount}`,
        }),
        error: 'Lỗi khi cấp chứng chỉ'
      });

      if (issueResult.successCount > 0 && onSuccess) onSuccess();
      if (issueResult.successCount > 0) onOpenChange(false);
    } catch (error) {
      console.error('Lỗi khi submit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeId = watch('certificateTypeId');
  const selectedType = certificateTypes.find(t => t.id === selectedTypeId);
  const selectedStudentIds = watch('studentIds') || [];
  const selectedStudentsData = studentsList.filter(s => selectedStudentIds.includes(s.student_id));

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-border shadow-2xl">
        <div className="p-6 border-b border-border bg-background relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <DialogHeader className="mb-0 relative z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Cấp Chứng Chỉ Nội Bộ
              </DialogTitle>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleClose(false)} className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="mt-2 text-muted-foreground">
              Quy trình tạo hàng loạt chứng chỉ nội bộ cho học viên. Các chứng chỉ sẽ được tạo ở trạng thái chờ duyệt.
            </DialogDescription>
          </DialogHeader>

          {/* Elegant Stepper */}
          <div className="mt-8 mb-2 px-4 relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
              </div>
              
              {STEPS.map((step, idx) => {
                const isCompleted = activeStep > idx;
                const isCurrent = activeStep === idx;
                
                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 shadow-sm",
                      isCompleted ? "bg-primary border-primary text-primary-foreground scale-100" :
                      isCurrent ? "bg-card border-primary text-primary scale-110 shadow-[0_0_15px_rgba(var(--primary),0.3)] ring-4 ring-primary/10" :
                      "bg-card border-border text-muted-foreground scale-95"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5 animate-in zoom-in duration-300" /> : idx + 1}
                    </div>
                    <span className={cn(
                      "text-xs font-semibold mt-3 transition-colors uppercase tracking-wider absolute top-12 whitespace-nowrap",
                      isCurrent ? "text-primary" : 
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <FormProvider {...methods}>
          <form className="flex-1 flex flex-col overflow-hidden" onSubmit={e => e.preventDefault()}>
            <div className="p-6 overflow-y-auto bg-muted flex-1">
              {activeStep === 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                  <StepSelectTypeAndStudents 
                    form={methods} 
                    onStudentsLoaded={setStudentsList} 
                  />
                </div>
              )}
              {activeStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                  <StepScoreInput 
                    form={methods} 
                    selectedStudents={selectedStudentsData} 
                    certificateType={selectedType}
                  />
                </div>
              )}
              {activeStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                  <StepPreviewAndConfirm 
                    form={methods} 
                    selectedStudents={selectedStudentsData} 
                    certificateType={selectedType}
                    centerInfo={centerInfo}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t border-border bg-background flex justify-between items-center px-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrev}
                disabled={activeStep === 0 || submitting}
                className="border-border bg-card hover:bg-muted font-semibold px-6"
              >
                Quay lại
              </Button>

              {activeStep < STEPS.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold px-8 shadow-sm transition-all"
                >
                  Tiếp tục bước {activeStep + 2}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleSubmit(onSubmit, onValidationError)}
                  disabled={submitting || selectedStudentIds.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 font-semibold shadow-sm transition-all shadow-emerald-600/20"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {submitting ? 'Đang xử lý...' : `Hoàn tất cấp ${selectedStudentIds.length} chứng chỉ`}
                </Button>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy cấp chứng chỉ?</AlertDialogTitle>
            <AlertDialogDescription>
              Dữ liệu đã nhập sẽ bị mất. Bạn có chắc muốn đóng?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục nhập</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose} className="bg-red-600 hover:bg-red-700">
              Đóng và hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

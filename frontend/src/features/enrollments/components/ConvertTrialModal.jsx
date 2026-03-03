/**
 * ConvertTrialModal Component
 *
 * Modal để chuyển đổi học thử thành đăng ký chính thức
 * ✅ Uses React Hook Form + Zod validation
 * ✅ Auto-creates Invoice after conversion
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowUpRight, CreditCard, Calendar, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { convertTrialSchema } from '@/lib/validations';
import { useEnrollments } from '../hooks';
import { gooeyToast } from 'goey-toast';

// Format currency VND
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Get default due date (7 days from now)
const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

export function ConvertTrialModal({
  isOpen,
  onClose,
  enrollment,
  onSuccess,
}) {
  const { convertTrialEnrollment } = useEnrollments();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // Store conversion result

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(convertTrialSchema),
    defaultValues: {
      tuition_fee: 0,
      discount_amount: 0,
      due_date: getDefaultDueDate(),
      create_invoice: true
    }
  });

  // Watch values for real-time calculation
  const tuitionFee = watch('tuition_fee') || 0;
  const discountAmount = watch('discount_amount') || 0;
  const createInvoice = watch('create_invoice');
  const finalAmount = Math.max(0, tuitionFee - discountAmount);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && enrollment) {
      reset({
        tuition_fee: enrollment.class?.course?.tuition_fee || 0,
        discount_amount: 0,
        due_date: getDefaultDueDate(),
        create_invoice: true
      });
      setResult(null);
    }
  }, [isOpen, enrollment, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const response = await convertTrialEnrollment(enrollment.id, data);

      if (response.data?.invoice) {
        setResult(response.data);
        gooeyToast.success(response.message || 'Đã chuyển đổi và tạo hóa đơn thành công');
      } else {
        gooeyToast.success(response.message || 'Đã chuyển đổi thành công');
        onSuccess?.();
        handleClose();
      }
    } catch (error) {
      gooeyToast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    reset();
    setResult(null);
    onClose();
  };

  // Handle done after viewing result
  const handleDone = () => {
    onSuccess?.();
    handleClose();
  };

  if (!enrollment) return null;

  // Show success result with invoice info
  if (result?.invoice) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Chuyển đổi thành công!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Success Message */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-medium">
                Đã chuyển đổi học thử thành đăng ký chính thức
              </p>
            </div>

            {/* Invoice Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-medium">
                <FileText className="h-4 w-4" />
                Hóa đơn đã tạo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Mã hóa đơn:</span>
                  <span className="font-mono font-medium">{result.invoice.invoice_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Số tiền:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(result.invoice.final_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hạn thanh toán:</span>
                  <span>{new Date(result.invoice.due_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Trạng thái:</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Chưa thanh toán
                  </Badge>
                </div>
              </div>
            </div>

            {/* Student & Class Info */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Học viên:</span>
                <span className="font-medium">{enrollment.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lớp:</span>
                <span className="font-medium">{enrollment.class_name}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleDone} className="w-full bg-green-500 hover:bg-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-green-500" />
            Chuyển đổi học thử
          </DialogTitle>
          <DialogDescription>
            Chuyển đổi từ học thử sang đăng ký chính thức với học phí
          </DialogDescription>
        </DialogHeader>

        {/* Enrollment Info */}
        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Học viên:</span>
            <span className="font-medium">{enrollment.student_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Lớp:</span>
            <span className="font-medium">{enrollment.class_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Trạng thái:</span>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Học thử
            </Badge>
          </div>
          {enrollment.days_remaining > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Còn lại:</span>
              <span className="text-sm text-amber-600">{enrollment.days_remaining} ngày</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tuition Fee */}
          <div className="space-y-2">
            <Label htmlFor="tuition_fee">
              Học phí <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="tuition_fee"
                type="number"
                className="pl-10"
                placeholder="5000000"
                {...register('tuition_fee', { valueAsNumber: true })}
              />
            </div>
            {errors.tuition_fee && (
              <p className="text-xs text-red-500">{errors.tuition_fee.message}</p>
            )}
          </div>

          {/* Discount Amount */}
          <div className="space-y-2">
            <Label htmlFor="discount_amount">Giảm giá</Label>
            <Input
              id="discount_amount"
              type="number"
              placeholder="0"
              {...register('discount_amount', { valueAsNumber: true })}
            />
            {errors.discount_amount && (
              <p className="text-xs text-red-500">{errors.discount_amount.message}</p>
            )}
          </div>

          {/* Summary */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Học phí:</span>
              <span className="font-medium">{formatCurrency(tuitionFee)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Giảm giá:</span>
              <span className="text-red-500">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="border-t border-green-200 mt-2 pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-green-800">Thành tiền:</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(finalAmount)}</span>
            </div>
          </div>

          {/* Invoice Options */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="create_invoice"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register('create_invoice')}
              />
              <Label htmlFor="create_invoice" className="text-sm font-medium text-blue-700 cursor-pointer">
                Tự động tạo hóa đơn
              </Label>
            </div>

            {createInvoice && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="due_date" className="text-sm text-blue-600">
                  Hạn thanh toán
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="due_date"
                    type="date"
                    className="pl-10"
                    {...register('due_date')}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Chuyển đổi {createInvoice && '& Tạo HĐ'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ConvertTrialModal;

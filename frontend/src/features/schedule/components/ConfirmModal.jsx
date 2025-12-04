/**
 * ConfirmModal - Modal xác nhận thay thế alert/confirm native
 * Thiết kế đẹp, đồng bộ với UI hệ thống
 */

import { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODAL_TYPES = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBg: 'bg-red-600 hover:bg-red-700 text-white',
    title: 'Xác nhận xóa'
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    title: 'Cảnh báo'
  },
  info: {
    icon: AlertCircle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    title: 'Xác nhận'
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmBg: 'bg-green-600 hover:bg-green-700 text-white',
    title: 'Thành công'
  }
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'danger',
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  loading = false
}) {
  if (!isOpen) return null;

  const config = MODAL_TYPES[type] || MODAL_TYPES.info;
  const Icon = config.icon;

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
        
        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          
          {/* Title */}
          <h3 
            className="text-lg font-semibold text-slate-900 mb-2"
            id="confirm-dialog-title"
          >
            {title || config.title}
          </h3>
          
          {/* Message */}
          <p className="text-slate-600 mb-6">
            {message}
          </p>
          
          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className={`min-w-[100px] ${config.confirmBg}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

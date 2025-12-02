/**
 * Toast Component
 * 
 * Component hiển thị thông báo (notification).
 * 
 * @param {boolean} show - Hiển thị hay không
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại: success | error | warning | info
 * @param {function} onClose - Handler đóng toast
 */

import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

const TOAST_CONFIG = {
  success: {
    bg: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle2,
    iconColor: 'text-green-600'
  },
  error: {
    bg: 'bg-red-50 border-red-200 text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-600'
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-600'
  }
};

export function Toast({ show, message, type = 'success', onClose }) {
  if (!show) return null;

  const config = TOAST_CONFIG[type] || TOAST_CONFIG.success;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${config.bg}`}>
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 p-0.5 hover:bg-white/50 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;

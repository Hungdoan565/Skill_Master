/**
 * ConfirmDialog Component
 * 
 * Reusable confirmation dialog để thay thế native confirm() và alert()
 * Hỗ trợ nhiều loại thông báo: danger, warning, info, success
 * 
 * @param {boolean} isOpen - Trạng thái hiển thị
 * @param {function} onClose - Handler đóng dialog
 * @param {function} onConfirm - Handler xác nhận (async supported)
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung thông báo
 * @param {string} confirmText - Text nút xác nhận
 * @param {string} cancelText - Text nút hủy
 * @param {string} variant - danger | warning | info | success
 * @param {boolean} showCancel - Hiển thị nút hủy
 * @param {ReactNode} icon - Custom icon (optional)
 */

import { useState } from 'react';
import {
    X,
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle,
    Loader2,
    Trash2,
    Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const VARIANTS = {
    danger: {
        icon: AlertTriangle,
        iconBg: 'bg-red-100 dark:bg-red-950/40',
        iconColor: 'text-red-600 dark:text-red-300',
        confirmBg: 'bg-red-600 hover:bg-red-700',
        confirmText: 'text-white',
        borderColor: 'border-red-200 dark:border-red-900/60'
    },
    warning: {
        icon: AlertCircle,
        iconBg: 'bg-amber-100 dark:bg-amber-950/40',
        iconColor: 'text-amber-600 dark:text-amber-300',
        confirmBg: 'bg-amber-600 hover:bg-amber-700',
        confirmText: 'text-white',
        borderColor: 'border-amber-200 dark:border-amber-900/60'
    },
    info: {
        icon: Info,
        iconBg: 'bg-blue-100 dark:bg-blue-950/40',
        iconColor: 'text-blue-600 dark:text-blue-300',
        confirmBg: 'bg-blue-600 hover:bg-blue-700',
        confirmText: 'text-white',
        borderColor: 'border-blue-200 dark:border-blue-900/60'
    },
    success: {
        icon: CheckCircle,
        iconBg: 'bg-green-100 dark:bg-green-950/40',
        iconColor: 'text-green-600 dark:text-green-300',
        confirmBg: 'bg-green-600 hover:bg-green-700',
        confirmText: 'text-white',
        borderColor: 'border-green-200 dark:border-green-900/60'
    }
};

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    variant = 'danger',
    showCancel = true,
    icon: CustomIcon,
    children
}) {
    const [loading, setLoading] = useState(false);

    const variantConfig = VARIANTS[variant] || VARIANTS.danger;
    const IconComponent = CustomIcon || variantConfig.icon;

    const handleConfirm = async () => {
        if (!onConfirm) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('ConfirmDialog error:', error);
            // Không close nếu có lỗi để user thấy được
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !loading) {
            onClose();
        } else if (e.key === 'Enter' && !loading) {
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => !loading && onClose()}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200 border border-slate-200 dark:border-slate-700">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="p-6">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${variantConfig.iconBg} flex items-center justify-center`}>
                            <IconComponent className={`w-6 h-6 ${variantConfig.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {message}
                            </p>

                            {/* Custom children content */}
                            {children && (
                                <div className="mt-4">
                                    {children}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={`flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-b-xl border-t ${variantConfig.borderColor}`}>
                    {showCancel && (
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1"
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`flex-1 ${variantConfig.confirmBg} ${variantConfig.confirmText}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Đang xử lý...
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * AlertDialog Component
 * 
 * Shortcut cho alert thông báo (chỉ có nút OK)
 */
export function AlertDialog({
    isOpen,
    onClose,
    title = 'Thông báo',
    message,
    confirmText = 'Đã hiểu',
    variant = 'info'
}) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onClose}
            title={title}
            message={message}
            confirmText={confirmText}
            variant={variant}
            showCancel={false}
        />
    );
}

/**
 * DeleteConfirmDialog Component
 * 
 * Preset cho xác nhận xóa
 */
export function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    itemName = 'mục này',
    title,
    message,
    permanent = false
}) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={title || (permanent ? 'Xóa vĩnh viễn?' : 'Xác nhận xóa')}
            message={message || (permanent
                ? `Bạn có CHẮC CHẮN muốn xóa vĩnh viễn "${itemName}"? Hành động này KHÔNG THỂ hoàn tác!`
                : `Bạn có chắc chắn muốn xóa "${itemName}"?`
            )}
            confirmText={permanent ? 'Xóa vĩnh viễn' : 'Xóa'}
            variant="danger"
            icon={permanent ? Ban : Trash2}
        />
    );
}

export default ConfirmDialog;

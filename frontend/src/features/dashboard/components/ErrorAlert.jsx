/**
 * ErrorAlert Component
 * Hiển thị thông báo lỗi với retry option
 */

import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export function ErrorAlert({ message, onRetry, onDismiss }) {
    if (!message) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-red-800">
                        Không thể tải dữ liệu
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                        {message}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <RefreshCw size={14} />
                                Thử lại
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Bỏ qua
                            </button>
                        )}
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 p-1 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-red-500" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default ErrorAlert;

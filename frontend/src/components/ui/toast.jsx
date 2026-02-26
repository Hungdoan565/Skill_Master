import { toast } from "sonner";
/**
 * Toast Notification System
 * 
 * Hệ thống thông báo toast để thay thế native toast()
 * Tự động ẩn sau một khoảng thời gian
 * 
 * Usage:
 * 1. Wrap app với ToastProvider: <ToastProvider><App /></ToastProvider>
 * 2. Trong component: const { showToast } = useToast();
 * 3. Gọi: showToast('Thành công!', 'success');
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast variants configuration
const TOAST_VARIANTS = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        textColor: 'text-green-800',
        progressColor: 'bg-green-500'
    },
    error: {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-800',
        progressColor: 'bg-red-500'
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        iconColor: 'text-amber-600',
        textColor: 'text-amber-800',
        progressColor: 'bg-amber-500'
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-800',
        progressColor: 'bg-blue-500'
    }
};

// Single Toast Component
function ToastItem({ toast, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef(null);

    const variant = TOAST_VARIANTS[toast.variant] || TOAST_VARIANTS.info;
    const Icon = variant.icon;

    // Progress bar animation
    useEffect(() => {
        if (toast.duration > 0) {
            const step = 100 / (toast.duration / 50); // Update every 50ms
            intervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev <= 0) {
                        clearInterval(intervalRef.current);
                        handleDismiss();
                        return 0;
                    }
                    return prev - step;
                });
            }, 50);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [toast.duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 200);
    };

    // Pause on hover
    const handleMouseEnter = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const handleMouseLeave = () => {
        if (toast.duration > 0 && progress > 0) {
            const step = 100 / (toast.duration / 50);
            intervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev <= 0) {
                        clearInterval(intervalRef.current);
                        handleDismiss();
                        return 0;
                    }
                    return prev - step;
                });
            }, 50);
        }
    };

    return (
        <div
            className={`
        relative overflow-hidden rounded-lg shadow-lg border
        ${variant.bgColor} ${variant.borderColor}
        ${isExiting ? 'animate-out fade-out slide-out-to-right duration-200' : 'animate-in slide-in-from-right fade-in duration-300'}
        transition-all transform
      `}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`flex-shrink-0 ${variant.iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {toast.title && (
                        <p className={`font-medium ${variant.textColor}`}>
                            {toast.title}
                        </p>
                    )}
                    <p className={`text-sm ${variant.textColor} ${toast.title ? 'mt-1 opacity-90' : ''}`}>
                        {toast.message}
                    </p>
                </div>

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className={`flex-shrink-0 p-1 rounded hover:bg-black/5 ${variant.textColor} opacity-60 hover:opacity-100 transition-opacity`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress bar */}
            {toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                    <div
                        className={`h-full ${variant.progressColor} transition-all duration-50 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// Toast Container
function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}

// Toast Provider
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);

    const showToast = useCallback((message, variant = 'info', options = {}) => {
        const id = ++toastIdRef.current;
        const toast = {
            id,
            message,
            variant,
            title: options.title,
            duration: options.duration ?? 4000, // Default 4 seconds
        };

        setToasts(prev => [...prev.slice(-4), toast]); // Max 5 toasts

        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Shorthand methods
    const toast = {
        success: (message, options) => showToast(message, 'success', options),
        error: (message, options) => showToast(message, 'error', options),
        warning: (message, options) => showToast(message, 'warning', options),
        info: (message, options) => showToast(message, 'info', options),
        dismiss: dismissToast,
        dismissAll: () => setToasts([])
    };

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, toast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export default ToastProvider;

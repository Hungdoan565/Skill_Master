import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Phone, User, Target, BookOpen, Clock, CheckCircle, Loader2, AlertCircle, BarChart3, MessageCircle, Monitor, FileEdit, Sunrise, Sun, Sunset, Timer } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// ============================================
// CONSULTATION MODAL
// Production-grade 2-step wizard for lead capture
// ============================================

const GOALS = [
    { id: 'ielts', label: 'Luyện thi IELTS', Icon: Target },
    { id: 'toeic', label: 'Luyện thi TOEIC', Icon: BarChart3 },
    { id: 'communication', label: 'Giao tiếp tiếng Anh', Icon: MessageCircle },
    { id: 'it', label: 'Tin học văn phòng', Icon: Monitor },
    { id: 'other', label: 'Khác', Icon: FileEdit },
];

const LEVELS = [
    { id: 'beginner', label: 'Mới bắt đầu', description: 'Chưa có nền tảng' },
    { id: 'elementary', label: 'Sơ cấp', description: 'Biết cơ bản' },
    { id: 'intermediate', label: 'Trung cấp', description: 'Giao tiếp được' },
    { id: 'advanced', label: 'Nâng cao', description: 'Muốn hoàn thiện' },
];

const CALL_TIMES = [
    { id: 'morning', label: '8:00 - 12:00', Icon: Sunrise },
    { id: 'afternoon', label: '12:00 - 17:00', Icon: Sun },
    { id: 'evening', label: '17:00 - 21:00', Icon: Sunset },
    { id: 'anytime', label: 'Bất kỳ lúc nào', Icon: Timer },
];

// Phone validation (Vietnam format)
const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    // Vietnam phone: 10 digits starting with 0, or 11 digits with +84
    return /^(0[3-9][0-9]{8}|84[3-9][0-9]{8})$/.test(cleaned);
};

export const ConsultationModal = ({ isOpen, onClose, source = 'header' }) => {
    // State management
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        goal: '',
        level: '',
        callTime: 'anytime',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'

    // Refs for focus management
    const modalRef = useRef(null);
    const nameInputRef = useRef(null);
    const firstFocusableRef = useRef(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({ name: '', phone: '', goal: '', level: '', callTime: 'anytime' });
            setErrors({});
            setSubmitStatus(null);
            // Focus first input after animation
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            }

            // Focus trap
            if (e.key === 'Tab' && modalRef.current) {
                const focusables = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Form handlers
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateStep1 = useCallback(() => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập họ tên';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Họ tên quá ngắn';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData.name, formData.phone]);

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrors({});

        try {
            // Submit to Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('consultation-api', {
                body: {
                    ...formData,
                    source,
                    source_page: window.location.pathname,
                    utm_params: Object.fromEntries(new URLSearchParams(window.location.search)),
                    submitted_at: new Date().toISOString(),
                }
            });

            if (error) throw error;
            // Track analytics
            if (window.gtag) {
                window.gtag('event', 'consultation_submitted', {
                    goal: formData.goal,
                    level: formData.level,
                    source,
                });
            }

            setSubmitStatus('success');
        } catch (error) {
            console.error('Consultation submission error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        setSubmitStatus(null);
        handleSubmit();
    };

    if (!isOpen) return null;

    // Success State
    if (submitStatus === 'success') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="success-title">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
                <div ref={modalRef} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce-in">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 id="success-title" className="text-2xl font-bold text-zinc-900 mb-2">
                            Cảm ơn bạn!
                        </h2>
                        <p className="text-zinc-600 mb-6">
                            Chúng tôi đã nhận được yêu cầu của bạn. Chuyên gia tư vấn sẽ liên hệ với bạn trong <strong>24 giờ tới</strong>.
                        </p>
                        <div className="bg-stone-50 rounded-2xl p-4 mb-6 text-left">
                            <p className="text-sm text-zinc-500 mb-2">Thông tin đã gửi:</p>
                            <p className="font-medium text-zinc-900">{formData.name}</p>
                            <p className="text-zinc-600">{formData.phone}</p>
                            {formData.goal && (
                                <p className="text-zinc-500 text-sm mt-1">
                                    Mục tiêu: {GOALS.find(g => g.id === formData.goal)?.label}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (submitStatus === 'error') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
                <div ref={modalRef} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                            Có lỗi xảy ra
                        </h2>
                        <p className="text-zinc-600 mb-6">
                            Không thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp qua hotline.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex-1 py-3.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                            >
                                Thử lại
                            </button>
                            <a
                                href="tel:1900xxxx"
                                className="flex-1 py-3.5 border-2 border-zinc-200 text-zinc-700 font-semibold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Phone className="w-4 h-4" />
                                Gọi 1900 xxxx
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Form
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />

            {/* Modal */}
            <div ref={modalRef} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-red-600 to-red-700">
                    <button
                        ref={firstFocusableRef}
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                    </div>

                    <h2 id="modal-title" className="text-2xl font-bold text-white mb-1">
                        {step === 1 ? 'Nhận tư vấn lộ trình học' : 'Thêm thông tin'}
                    </h2>
                    <p className="text-white/90 text-sm">
                        {step === 1 ? 'Chuyên gia sẽ liên hệ bạn trong 24h' : 'Để chúng tôi tư vấn phù hợp hơn (không bắt buộc)'}
                    </p>
                </div>

                {/* Form Content */}
                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-5">
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-2">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                    <input
                                        ref={nameInputRef}
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-zinc-900 placeholder:text-zinc-400 
                      focus:outline-none focus:ring-0 transition-colors
                      ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-900'}`}
                                        aria-invalid={errors.name ? 'true' : 'false'}
                                        aria-describedby={errors.name ? 'name-error' : undefined}
                                    />
                                </div>
                                {errors.name && (
                                    <p id="name-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-2">
                                    Số điện thoại <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="0901 234 567"
                                        className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-zinc-900 placeholder:text-zinc-400 
                      focus:outline-none focus:ring-0 transition-colors
                      ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-900'}`}
                                        aria-invalid={errors.phone ? 'true' : 'false'}
                                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                                    />
                                </div>
                                {errors.phone && (
                                    <p id="phone-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Goal Selection (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Bạn quan tâm đến
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {GOALS.slice(0, 4).map((goal) => (
                                        <button
                                            key={goal.id}
                                            type="button"
                                            onClick={() => handleInputChange('goal', goal.id)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all text-left
                        ${formData.goal === goal.id
                                                    ? 'bg-red-50 border-2 border-red-500 text-red-700'
                                                    : 'bg-stone-50 border-2 border-transparent hover:border-zinc-200 text-zinc-700'
                                                }`}
                                        >
                                            <goal.Icon className={`w-5 h-5 mb-1.5 ${formData.goal === goal.id ? 'text-red-600' : 'text-zinc-400'}`} />
                                            {goal.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            {/* Level Selection */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    <BookOpen className="w-4 h-4 inline mr-1" />
                                    Trình độ hiện tại
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {LEVELS.map((level) => (
                                        <button
                                            key={level.id}
                                            type="button"
                                            onClick={() => handleInputChange('level', level.id)}
                                            className={`p-3 rounded-xl text-left transition-all
                        ${formData.level === level.id
                                                    ? 'bg-red-50 border-2 border-red-500'
                                                    : 'bg-stone-50 border-2 border-transparent hover:border-zinc-200'
                                                }`}
                                        >
                                            <p className={`font-medium ${formData.level === level.id ? 'text-red-700' : 'text-zinc-900'}`}>
                                                {level.label}
                                            </p>
                                            <p className="text-xs text-zinc-500">{level.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Call Time Preference */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    Thời gian thuận tiện liên hệ
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CALL_TIMES.map((time) => (
                                        <button
                                            key={time.id}
                                            type="button"
                                            onClick={() => handleInputChange('callTime', time.id)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                        ${formData.callTime === time.id
                                                    ? 'bg-red-50 border-2 border-red-500 text-red-700'
                                                    : 'bg-stone-50 border-2 border-transparent hover:border-zinc-200 text-zinc-700'
                                                }`}
                                        >
                                            <time.Icon className={`w-4 h-4 ${formData.callTime === time.id ? 'text-red-600' : 'text-zinc-400'}`} />
                                            {time.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 pb-8 flex items-center gap-3">
                    {step === 2 && (
                        <button
                            onClick={handleBack}
                            className="px-5 py-3.5 text-zinc-600 font-medium rounded-xl hover:bg-stone-100 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    )}

                    {step === 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                        >
                            Tiếp tục
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        Gửi yêu cầu tư vấn
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>

                {/* Skip link for step 2 */}
                {step === 2 && !isSubmitting && (
                    <div className="px-8 pb-6 text-center">
                        <button
                            onClick={handleSubmit}
                            className="text-sm text-zinc-500 hover:text-zinc-700 underline transition-colors"
                        >
                            Bỏ qua, gửi luôn
                        </button>
                    </div>
                )}
            </div>

            {/* Animations */}
            <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bounce-in { 
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
        </div>
    );
};

export default ConsultationModal;

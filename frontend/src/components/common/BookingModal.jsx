import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, Phone, User, Calendar, Clock, CheckCircle, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// ============================================
// BOOKING MODAL
// Single-step quick booking for trial classes
// ============================================

const TIME_SLOTS = [
    { id: 'morning_weekday', label: 'Sáng thứ 2-6', time: '8:00 - 11:00' },
    { id: 'afternoon_weekday', label: 'Chiều thứ 2-6', time: '14:00 - 17:00' },
    { id: 'evening_weekday', label: 'Tối thứ 2-6', time: '18:00 - 21:00' },
    { id: 'morning_weekend', label: 'Sáng thứ 7-CN', time: '8:00 - 11:00' },
    { id: 'afternoon_weekend', label: 'Chiều thứ 7-CN', time: '14:00 - 17:00' },
];

const COURSES = [
    { id: 'ielts', label: 'IELTS Academic' },
    { id: 'toeic', label: 'TOEIC 4 kỹ năng' },
    { id: 'communication', label: 'Giao tiếp tiếng Anh' },
    { id: 'office', label: 'Tin học văn phòng' },
    { id: 'kids', label: 'Tiếng Anh thiếu nhi' },
];

// Phone validation (Vietnam format)
const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(0[3-9][0-9]{8}|84[3-9][0-9]{8})$/.test(cleaned);
};

export const BookingModal = ({ isOpen, onClose, defaultCourse = '', source = 'header' }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        course: defaultCourse,
        timeSlot: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const modalRef = useRef(null);
    const nameInputRef = useRef(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', phone: '', course: defaultCourse, timeSlot: '' });
            setErrors({});
            setSubmitStatus(null);
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen, defaultCourse]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = useCallback(() => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
        if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
        else if (!validatePhone(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
        if (!formData.timeSlot) newErrors.timeSlot = 'Vui lòng chọn thời gian';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.functions.invoke('consultation-api', {
                body: {
                    ...formData,
                    source,
                    source_page: window.location.pathname,
                    submitted_at: new Date().toISOString(),
                }
            });

            if (error) throw error;

            if (window.gtag) {
                window.gtag('event', 'trial_booking_submitted', { course: formData.course, source });
            }

            setSubmitStatus('success');
        } catch (error) {
            console.error('Booking error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Success
    if (submitStatus === 'success') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
                <div ref={modalRef} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce-in">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Đặt lịch thành công!</h2>
                        <p className="text-zinc-600 mb-6">
                            Chúng tôi sẽ liên hệ xác nhận lịch học thử trong <strong>24 giờ</strong>.
                        </p>
                        <div className="bg-stone-50 rounded-2xl p-4 mb-6 text-left space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-400" />
                                <span className="text-zinc-900">{formData.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-zinc-400" />
                                <span className="text-zinc-600">{formData.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <span className="text-zinc-600">
                                    {TIME_SLOTS.find(t => t.id === formData.timeSlot)?.label}
                                </span>
                            </div>
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

    // Error
    if (submitStatus === 'error') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
                <div ref={modalRef} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Có lỗi xảy ra</h2>
                        <p className="text-zinc-600 mb-6">Vui lòng thử lại hoặc gọi hotline.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => { setSubmitStatus(null); handleSubmit(); }} className="flex-1 py-3.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors">
                                Thử lại
                            </button>
                            <a href="tel:1900xxxx" className="flex-1 py-3.5 border-2 border-zinc-200 text-zinc-700 font-semibold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4" /> Gọi 1900 xxxx
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Form
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />

            <div ref={modalRef} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-emerald-600 to-teal-700">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors" aria-label="Đóng">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h2 id="booking-title" className="text-2xl font-bold text-white">
                            Đặt lịch học thử
                        </h2>
                    </div>
                    <p className="text-white/90 text-sm">Trải nghiệm miễn phí 1 buổi học</p>
                </div>

                {/* Form */}
                <div className="p-8 space-y-5">
                    {/* Name */}
                    <div>
                        <label htmlFor="booking-name" className="block text-sm font-medium text-zinc-700 mb-2">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                ref={nameInputRef}
                                id="booking-name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Nguyễn Văn A"
                                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors
                  ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-900'}`}
                            />
                        </div>
                        {errors.name && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="booking-phone" className="block text-sm font-medium text-zinc-700 mb-2">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                id="booking-phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="0901 234 567"
                                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors
                  ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-900'}`}
                            />
                        </div>
                        {errors.phone && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.phone}</p>}
                    </div>

                    {/* Course (optional) */}
                    <div>
                        <label htmlFor="booking-course" className="block text-sm font-medium text-zinc-700 mb-2">
                            Khóa học quan tâm
                        </label>
                        <select
                            id="booking-course"
                            value={formData.course}
                            onChange={(e) => handleInputChange('course', e.target.value)}
                            className="w-full px-4 py-3.5 border-2 border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white"
                        >
                            <option value="">-- Chọn khóa học --</option>
                            {COURSES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </div>

                    {/* Time Slot */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Thời gian thuận tiện <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {TIME_SLOTS.map((slot) => (
                                <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => handleInputChange('timeSlot', slot.id)}
                                    className={`p-3 rounded-xl text-left transition-all
                    ${formData.timeSlot === slot.id
                                            ? 'bg-emerald-50 border-2 border-emerald-500'
                                            : 'bg-stone-50 border-2 border-transparent hover:border-zinc-200'
                                        }`}
                                >
                                    <p className={`text-sm font-medium ${formData.timeSlot === slot.id ? 'text-emerald-700' : 'text-zinc-900'}`}>
                                        {slot.label}
                                    </p>
                                    <p className="text-xs text-zinc-500">{slot.time}</p>
                                </button>
                            ))}
                        </div>
                        {errors.timeSlot && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.timeSlot}</p>}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                        ) : (
                            <>Xác nhận đặt lịch <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
        </div>
    );
};

export default BookingModal;

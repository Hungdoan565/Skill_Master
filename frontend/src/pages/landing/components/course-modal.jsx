import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, BookOpen, CheckCircle2, ArrowRight, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Course Quick View Modal
 * Shows detailed info about a course without leaving the landing page
 */
export const CourseModal = ({ isOpen, onClose, course }) => {
    const [activeTab, setActiveTab] = useState('overview'); // overview, syllabus, schedule

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !course) return null;

    const { details } = course;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className={`relative px-8 py-6 bg-gradient-to-r ${course.color || 'from-zinc-100 to-zinc-200'}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full mb-3 border border-white/20">
                        {course.category}
                    </span>
                    <h2 className="text-3xl font-bold text-white mb-2">{course.title}</h2>
                    <p className="text-white/90 text-sm">{course.description}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-100 px-8">
                    {[
                        { id: 'overview', label: 'Tổng quan' },
                        { id: 'syllabus', label: 'Lộ trình học' },
                        { id: 'schedule', label: 'Lịch & Học phí' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-4 text-sm font-medium transition-colors relative
                ${activeTab === tab.id ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-900'}
              `}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    Điểm nổi bật
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {course.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-sm text-zinc-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    <strong>Cam kết đầu ra:</strong> Hoàn lại 100% học phí hoặc học lại miễn phí nếu không đạt kết quả như cam kết sau khóa học.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'syllabus' && (
                        <div className="space-y-4">
                            {details?.syllabus?.map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div className="pt-1">
                                        <p className="font-medium text-zinc-900">{item}</p>
                                    </div>
                                </div>
                            ))}
                            {!details?.syllabus && <p className="text-zinc-500 italic">Chi tiết lộ trình đang được cập nhật.</p>}
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">Khai giảng</span>
                                    </div>
                                    <p className="font-bold text-zinc-900 text-lg">{details?.startDate || 'Liên hệ'}</p>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">Lịch học</span>
                                    </div>
                                    <p className="font-bold text-zinc-900 text-lg">{details?.schedule || 'Linh hoạt'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-5 bg-zinc-900 text-white rounded-2xl shadow-lg">
                                <div>
                                    <p className="text-zinc-400 text-sm mb-1">Học phí trọn gói</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">{details?.price || 'Liên hệ'}</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-medium text-zinc-600 hover:bg-stone-200 transition-colors"
                    >
                        Đóng
                    </button>
                    <Link
                        to="/register"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                        Đăng ký tư vấn ngay
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e7e5e4; border-radius: 20px; }
      `}</style>
        </div>
    );
};

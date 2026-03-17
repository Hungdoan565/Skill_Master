import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { submitContactForm, validatePhone, validateName } from '@/utils/contactFormUtils';

/**
 * CTA Section — Inline Lead Capture Form  
 * PRODUCTION: Submits to real consultation-api Edge Function
 * Same API as ConsultationModal for consistency
 */
export const CTASection = () => {
    const [ref, isInView] = useInView();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        goal: 'IELTS'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        if (!validateName(formData.name)) {
            errors.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự)';
        }
        if (!validatePhone(formData.phone)) {
            errors.phone = 'Số điện thoại không hợp lệ';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const result = await submitContactForm({
                name: formData.name,
                email: formData.email || `${formData.phone.replace(/\s/g, '')}@landing.skillmaster.vn`,
                phone: formData.phone,
                message: `Mục tiêu: ${formData.goal}`,
                interest: formData.goal,
            }, 'landing-cta-inline');

            if (result.success) {
                setIsSuccess(true);
                // Track conversion
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'generate_lead', {
                        event_category: 'conversion',
                        event_label: 'landing_cta_inline',
                        value: 1,
                    });
                }
            } else {
                setError(result.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Không thể gửi form. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section ref={ref} className="relative py-24 lg:py-32 bg-zinc-950 overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute inset-0 select-none pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Left: Value Proposition */}
                    <div className={`space-y-8 transform transition-all duration-700
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm font-medium text-white/80">Tư vấn miễn phí — không cam kết</span>
                        </div>

                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                            Bắt đầu hành trình
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                ngay hôm nay
                            </span>
                        </h2>

                        <p className="text-lg text-stone-400 leading-relaxed max-w-xl">
                            Đừng để rào cản ngôn ngữ và công nghệ kìm hãm sự nghiệp. Đăng ký nhận tư vấn 
                            lộ trình cá nhân hóa — hoàn toàn miễn phí, không ràng buộc.
                        </p>

                        {/* Checklist */}
                        <div className="space-y-4">
                            {[
                                'Kiểm tra trình độ miễn phí (15 phút)',
                                'Tư vấn lộ trình học 1:1 với chuyên gia',
                                'Trải nghiệm hệ thống Skill Master trước khi đăng ký'
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 group">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span className="text-stone-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Lead Capture Form */}
                    <div className={`transform transition-all duration-700 delay-200
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                        <div className="relative p-8 lg:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                            {/* Decorative Glow */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />

                            {!isSuccess ? (
                                <form onSubmit={handleSubmit} className="relative space-y-6" id="cta-form">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-white mb-2">Nhận tư vấn miễn phí</h3>
                                        <p className="text-stone-400 text-sm">Chuyên gia sẽ liên hệ trong vòng 24h</p>
                                    </div>

                                    {/* Error message */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Họ và tên *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all
                                                    ${fieldErrors.name ? 'border-red-500/50' : 'border-white/10'}`}
                                                placeholder="Nguyễn Văn A"
                                                value={formData.name}
                                                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors({ ...fieldErrors, name: '' }); }}
                                                id="cta-name"
                                            />
                                            {fieldErrors.name && (
                                                <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Số điện thoại *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all
                                                    ${fieldErrors.phone ? 'border-red-500/50' : 'border-white/10'}`}
                                                placeholder="0912 xxx xxx"
                                                value={formData.phone}
                                                onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setFieldErrors({ ...fieldErrors, phone: '' }); }}
                                                id="cta-phone"
                                            />
                                            {fieldErrors.phone && (
                                                <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Email (không bắt buộc)
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                                placeholder="email@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                id="cta-email"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Mục tiêu học tập
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 ease-out appearance-none cursor-pointer hover:border-white/20"
                                                value={formData.goal}
                                                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                                id="cta-goal"
                                            >
                                                <option value="IELTS" className="bg-zinc-900">IELTS Academic (Du học/Định cư)</option>
                                                <option value="TOEIC" className="bg-zinc-900">TOEIC (Ra trường/Đi làm)</option>
                                                <option value="COMM" className="bg-zinc-900">Tiếng Anh Giao tiếp</option>
                                                <option value="OFFICE" className="bg-zinc-900">Tin học văn phòng (MOS/IC3)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Honeypot */}
                                    <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                        id="cta-submit"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                            <>
                                                Đăng ký tư vấn miễn phí
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-stone-500">
                                        *Cam kết bảo mật thông tin 100%. Không spam.
                                    </p>
                                </form>
                            ) : (
                                <div className="relative py-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Đăng ký thành công!</h3>
                                        <p className="text-stone-400">
                                            Cảm ơn <strong className="text-white">{formData.name}</strong> đã quan tâm.
                                            <br />
                                            Chuyên gia tư vấn sẽ liên hệ qua SĐT <strong className="text-white">{formData.phone}</strong> trong vòng 24h.
                                        </p>
                                    </div>
                                    <a
                                        href="#courses"
                                        className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Tham khảo khóa học
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

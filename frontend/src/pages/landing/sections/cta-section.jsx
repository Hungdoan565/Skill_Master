import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { useNavigate } from 'react-router-dom';

export const CTASection = () => {
    const [ref, isInView] = useInView();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        goal: 'IELTS'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            console.log('Lead Magnet Form Submitted:', formData);
        }, 1500);
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
                            <span className="text-sm font-medium text-white/80">Ưu đãi giới hạn tháng 12</span>
                        </div>

                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                            Sẵn sàng bứt phá
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                năng lực của bạn?
                            </span>
                        </h2>

                        <p className="text-lg text-stone-400 leading-relaxed max-w-xl">
                            Đừng để rào cản ngôn ngữ và công nghệ kìm hãm sự nghiệp. Đăng ký nhận tư vấn lộ trình cá nhân hóa miễn phí ngay hôm nay.
                        </p>

                        {/* Checklist */}
                        <div className="space-y-4">
                            {[
                                'Kiểm tra trình độ miễn phí (15 phút)',
                                'Tư vấn lộ trình học 1:1 với chuyên gia',
                                'Nhận bộ tài liệu độc quyền Skill Master'
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 group">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                                        <CheckCircle2 className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span className="text-stone-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        {/* Trust Signal - FIXED AVATARS */}
                        <div className="pt-8 border-t border-white/10 flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[
                                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
                                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
                                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
                                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
                                ].map((src, i) => (
                                    <img
                                        key={i}
                                        src={src}
                                        alt="Student"
                                        className="w-10 h-10 rounded-full border-2 border-zinc-950"
                                    />
                                ))}
                            </div>
                            <div>
                                <p className="text-white font-bold">2,400+ Học viên</p>
                                <p className="text-sm text-stone-500">đã đăng ký tháng này</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Lead Magnet Form */}
                    <div className={`transform transition-all duration-700 delay-200
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                        <div className="relative p-8 lg:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                            {/* Decorative Glow */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />

                            {!isSuccess ? (
                                <form onSubmit={handleSubmit} className="relative space-y-6">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-white mb-2">Nhận lộ trình miễn phí</h3>
                                        <p className="text-stone-400 text-sm">Chuyên gia sẽ liên hệ trong vòng 24h</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Họ và tên
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                                placeholder="Nguyễn Văn A"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Số điện thoại
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                                placeholder="0912 xxx xxx"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                                                Mục tiêu học tập
                                            </label>
                                            {/* FIXED: Added smooth transition to select */}
                                            <select
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 ease-out appearance-none cursor-pointer hover:border-white/20"
                                                value={formData.goal}
                                                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                            >
                                                <option value="IELTS" className="bg-zinc-900">IELTS Academic (Du học/Định cư)</option>
                                                <option value="TOEIC" className="bg-zinc-900">TOEIC (Ra trường/Đi làm)</option>
                                                <option value="COMM" className="bg-zinc-900">Tiếng Anh Giao tiếp</option>
                                                <option value="OFFICE" className="bg-zinc-900">Tin học văn phòng (MOS/IC3)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                            <>
                                                Đăng ký ngay
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-stone-500">
                                        *Cam kết bảo mật thông tin 100%
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
                                            Cảm ơn <strong>{formData.name}</strong> đã quan tâm.
                                            <br />
                                            Chuyên gia tư vấn sẽ liên hệ với bạn qua SĐT <strong>{formData.phone}</strong> trong thời gian sớm nhất.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/courses')}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Tham khảo khóa học
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

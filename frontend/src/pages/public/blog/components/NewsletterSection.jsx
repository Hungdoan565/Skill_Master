import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useInView } from '../hooks/useBlogHooks';

// ============================================
// NEWSLETTER CTA SECTION - MATCHING CTA STYLE
// ============================================
export const NewsletterSection = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ref, isInView] = useInView();

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setEmail('');
        }, 1500);
    };

    return (
        <section ref={ref} className="relative py-24 bg-zinc-950 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 select-none pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className={`max-w-2xl mx-auto text-center transition-all duration-700
                    ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 
                        bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-6
                        shadow-lg shadow-red-500/30">
                        <Mail className="w-8 h-8 text-white" />
                    </div>

                    <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                        Đăng ký nhận bài viết mới
                    </h2>
                    <p className="text-lg text-stone-400 mb-8">
                        Nhận thông báo khi có bài viết mới qua email. Không spam, hủy bất cứ lúc nào.
                    </p>

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email của bạn..."
                                required
                                className="flex-1 px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl 
                                    text-white placeholder:text-stone-500 
                                    focus:border-red-500 focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 
                                    hover:from-red-500 hover:to-orange-500 
                                    text-white font-bold rounded-xl transition-all 
                                    shadow-lg shadow-red-900/20 
                                    flex items-center justify-center gap-2 group
                                    disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Đăng ký
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="py-8 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-xl font-semibold text-white mb-2">Đăng ký thành công!</p>
                            <p className="text-stone-400">Cảm ơn bạn đã đăng ký nhận bản tin.</p>
                        </div>
                    )}

                    <p className="text-xs text-stone-500 mt-6">
                        *Cam kết bảo mật thông tin 100%
                    </p>
                </div>
            </div>
        </section>
    );
};

export default NewsletterSection;

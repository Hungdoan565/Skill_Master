import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';

export const CTASection = () => {
    const [ref, isInView] = useInView();

    return (
        <section ref={ref} className="py-32 bg-zinc-900 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0" aria-hidden="true">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
                <div className={`max-w-3xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="font-display text-4xl lg:text-6xl font-bold text-white tracking-tight">
                        Sẵn sàng bắt đầu
                        <br />
                        hành trình của bạn?
                    </h2>
                    <p className="mt-6 text-lg text-stone-400 leading-relaxed">
                        Đăng ký học thử miễn phí ngay hôm nay.
                        Trải nghiệm phương pháp học tập hiệu quả cùng giáo viên chuyên nghiệp.
                    </p>

                    {/* CTA Buttons */}
                    <div className={`mt-12 flex flex-col sm:flex-row gap-4 justify-center
                        transform transition-all duration-700 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 
                      bg-white text-zinc-900 rounded-full font-semibold
                      hover:bg-zinc-100 transition-colors shadow-lg shadow-white/20"
                        >
                            Đăng ký học thử miễn phí
                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 
                      border border-white/30 text-white rounded-full font-semibold
                      hover:bg-white/10 transition-colors"
                        >
                            <Phone className="w-5 h-5" aria-hidden="true" />
                            Tư vấn lộ trình
                        </Link>
                    </div>

                    {/* Trust Note */}
                    <p className="mt-8 text-sm text-stone-500">
                        ✓ Cam kết đầu ra  •  ✓ Lớp học 8-12 học viên  •  ✓ Học lại miễn phí
                    </p>
                </div>
            </div>
        </section>
    );
};

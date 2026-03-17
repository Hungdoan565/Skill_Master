import React, { useState } from 'react';
import { SmartImage } from '@/components/common';
import { ConsultationModal } from '@/components/common';
import { ArrowRight, Play, CheckCircle2, TrendingUp, Shield, Award, Star } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { landingImages } from '../constants/landing-data';

/**
 * Hero Section — Revenue-focused, LIGHT background (original style)
 * Primary CTA → ConsultationModal (lead capture)
 * Shows real product screenshot + floating trust elements
 */
export const HeroSection = () => {
    const [ref, isInView] = useInView();
    const [showConsultation, setShowConsultation] = useState(false);

    return (
        <>
            <section
                ref={ref}
                className="relative min-h-screen flex items-center pt-20 overflow-hidden"
                aria-label="Hero section"
            >
                {/* Background — ORIGINAL light theme */}
                <div className="absolute inset-0 bg-stone-50">
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(#18181B 1px, transparent 1px),
                                  linear-gradient(90deg, #18181B 1px, transparent 1px)`,
                            backgroundSize: '60px 60px'
                        }}
                        aria-hidden="true" />
                    <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] 
                        bg-gradient-to-br from-red-100 via-orange-50 to-transparent 
                        rounded-full blur-3xl opacity-60"
                        aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] 
                        bg-gradient-to-tr from-zinc-100 to-transparent 
                        rounded-full blur-3xl opacity-80"
                        aria-hidden="true" />
                </div>

                <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        {/* Left Content */}
                        <div className="lg:col-span-7 space-y-8">
                            {/* Badge */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur
                            border border-stone-200 rounded-full shadow-sm
                            transform transition-all duration-700 delay-100
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <span className="flex h-2 w-2" aria-hidden="true">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                                </span>
                                <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">
                                    Khai giảng tháng 4 — Còn 8 suất
                                </span>
                            </div>

                            {/* Main Headline */}
                            <h1 className={`transform transition-all duration-700 delay-200
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                             text-zinc-900 tracking-tight leading-[1.1]">
                                    Chinh phục
                                </span>
                                <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                             tracking-tight leading-[1.1] mt-2">
                                    <span className="text-zinc-900">Anh ngữ</span>
                                    <span className="text-red-600"> & </span>
                                    <span className="text-zinc-900">Tin học</span>
                                </span>
                                <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                             text-zinc-400 tracking-tight leading-[1.1] mt-2">
                                    một cách bài bản.
                                </span>
                            </h1>

                            {/* Description */}
                            <p className={`max-w-lg text-lg text-zinc-500 leading-relaxed
                          transform transition-all duration-700 delay-300
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                Hệ thống đào tạo chuẩn quốc tế, phương pháp học hiện đại,
                                cam kết đầu ra với lộ trình cá nhân hóa cho từng học viên.
                            </p>

                            {/* CTA Buttons */}
                            <div className={`flex flex-wrap items-center gap-4
                            transform transition-all duration-700 delay-400
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <button
                                    onClick={() => setShowConsultation(true)}
                                    className="group inline-flex items-center gap-3 px-8 py-4 
                           bg-red-600 text-white text-base font-semibold rounded-full
                           shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30
                           hover:bg-red-700 active:scale-[0.98] transition-all duration-300"
                                    aria-label="Đăng ký tư vấn miễn phí"
                                    id="hero-cta-primary"
                                >
                                    Nhận tư vấn miễn phí
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                </button>

                                <a
                                    href="#method"
                                    className="group inline-flex items-center gap-3 px-6 py-4 
                           text-zinc-700 font-medium hover:text-zinc-900 transition-colors"
                                    aria-label="Tìm hiểu thêm"
                                >
                                    <span className="flex items-center justify-center w-12 h-12 rounded-full 
                                bg-white border border-stone-200 shadow-sm
                                group-hover:shadow-md group-hover:border-red-200 
                                group-hover:bg-red-50 transition-all duration-300">
                                        <Play className="w-5 h-5 text-zinc-700 group-hover:text-red-600 ml-0.5"
                                            fill="currentColor" aria-hidden="true" />
                                    </span>
                                    Tìm hiểu thêm
                                </a>
                            </div>

                            {/* Trust Indicators */}
                            <div className={`flex items-center gap-8 pt-8 border-t border-stone-200
                            transform transition-all duration-700 delay-500
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-zinc-600">Cam kết đầu ra</span>
                                    </div>
                                    <div className="w-px h-4 bg-stone-300" />
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <span className="text-sm text-zinc-600">Chứng chỉ Quốc tế</span>
                                    </div>
                                    <div className="w-px h-4 bg-stone-300 hidden sm:block" />
                                    <div className="hidden sm:flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-zinc-600">4.9/5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Visual — Product Screenshot */}
                        <div className={`lg:col-span-5 transform transition-all duration-1000 delay-300
                          ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                            <div className="relative">
                                {/* Product Mockup Card */}
                                <div className="relative bg-white rounded-3xl shadow-2xl shadow-zinc-900/10 
                             border border-stone-100 overflow-hidden 
                             hover:shadow-3xl hover:shadow-zinc-900/15 transition-shadow duration-500">
                                    <SmartImage
                                        src={landingImages.hero.productMockup}
                                        alt="Skill Master dashboard - quản lý trung tâm đào tạo"
                                        className="w-full h-full object-cover"
                                        containerClassName="w-full aspect-[4/3]"
                                    />
                                </div>

                                {/* Floating Card — Satisfaction */}
                                <div className="absolute top-8 -right-6 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl 
                             border border-stone-100 animate-float z-20 hidden lg:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">92% hài lòng</p>
                                            <p className="text-xs text-zinc-500">khảo sát 2025</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Card — Active Stats */}
                                <div className="absolute bottom-16 -left-6 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl 
                             border border-stone-100 animate-float z-20 hidden lg:block"
                                    style={{ animationDelay: '1s' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">500+ học viên</p>
                                            <p className="text-xs text-zinc-500">đang theo học</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Scroll</span>
                        <div className="w-px h-8 bg-gradient-to-b from-zinc-300 to-transparent" />
                    </div>
                </div>
            </section>

            {/* Consultation Modal */}
            <ConsultationModal
                isOpen={showConsultation}
                onClose={() => setShowConsultation(false)}
                source="hero"
            />
        </>
    );
};

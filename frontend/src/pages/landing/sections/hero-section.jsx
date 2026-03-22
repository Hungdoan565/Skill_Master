import React, { useState } from 'react';
import { ConsultationModal } from '@/components/common';
import { ArrowRight, Play, CheckCircle2, TrendingUp, Shield, Award, Star, Calendar, Quote } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { heroCourseCard, teachers, testimonials } from '../constants/landing-data';

/**
 * Hero Section — Revenue-focused, LIGHT background (original style)
 * Primary CTA → ConsultationModal (lead capture)
 * Shows real product screenshot + floating trust elements
 */
export const HeroSection = () => {
    const [ref, isInView] = useInView();
    const [showConsultation, setShowConsultation] = useState(false);
    const featuredTeacher = teachers.find((teacher) => teacher.name === heroCourseCard.instructor.name) ?? teachers[0];
    const featuredTestimonial = testimonials.find((testimonial) => testimonial.featured) ?? testimonials[0];
    const progressWidth = `${Math.min(Math.max(heroCourseCard.progress, 0), 100)}%`;

    return (
        <>
            <section
                ref={ref}
                className="relative min-h-screen flex items-center pt-20 overflow-hidden"
                aria-label="Hero section"
            >
                {/* Background — ORIGINAL light theme */}
                <div className="absolute inset-0 bg-muted">
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
                            border border-border rounded-full shadow-sm
                            transform transition-all duration-700 delay-100
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <span className="flex h-2 w-2" aria-hidden="true">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                                </span>
                                <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                                    Khai giảng tháng 4 — Còn 8 suất
                                </span>
                            </div>

                            {/* Main Headline */}
                            <h1 className={`transform transition-all duration-700 delay-200
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                             text-foreground tracking-tight leading-[1.1]">
                                    Chinh phục
                                </span>
                                <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                             tracking-tight leading-[1.1] mt-2">
                                    <span className="text-foreground">Anh ngữ</span>
                                    <span className="text-red-600"> & </span>
                                    <span className="text-foreground">Tin học</span>
                                </span>
                                <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                             text-muted-foreground/70 tracking-tight leading-[1.1] mt-2">
                                    một cách bài bản.
                                </span>
                            </h1>

                            {/* Description */}
                            <p className={`max-w-lg text-lg text-muted-foreground leading-relaxed
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
                           text-foreground/90 font-medium hover:text-foreground transition-colors"
                                    aria-label="Tìm hiểu thêm"
                                >
                                    <span className="flex items-center justify-center w-12 h-12 rounded-full 
                                bg-card border border-border shadow-sm
                                group-hover:shadow-md group-hover:border-red-200 
                                group-hover:bg-red-50 transition-all duration-300">
                                        <Play className="w-5 h-5 text-foreground/90 group-hover:text-red-600 ml-0.5"
                                            fill="currentColor" aria-hidden="true" />
                                    </span>
                                    Tìm hiểu thêm
                                </a>
                            </div>

                            {/* Trust Indicators */}
                            <div className={`flex items-center gap-8 pt-8 border-t border-border
                            transform transition-all duration-700 delay-500
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-muted-foreground">Cam kết đầu ra</span>
                                    </div>
                                    <div className="w-px h-4 bg-stone-300" />
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-amber-500" />
                                        <span className="text-sm text-muted-foreground">Chứng chỉ Quốc tế</span>
                                    </div>
                                    <div className="w-px h-4 bg-stone-300 hidden sm:block" />
                                    <div className="hidden sm:flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">4.9/5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Visual — Proof Board */}
                        <div className={`lg:col-span-5 relative transform transition-all duration-1000 delay-300
                          ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                            
                            {/* Ambient Background Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-red-100/40 to-blue-50/40 rounded-full blur-[80px] -z-10" />

                            {/* Proof Board Container: Stack on mobile, absolute positioning on desktop */}
                            <div className="flex flex-col gap-5 sm:gap-6 lg:block lg:h-[580px] w-full mt-12 lg:mt-0 relative z-10">
                                
                                {/* Card 1: Dominant Course Progress */}
                                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-black/5 border border-white lg:absolute lg:top-0 lg:left-0 lg:w-[380px] z-20 group hover:-translate-y-1 transition-transform duration-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold mb-3 border border-red-100">
                                                {heroCourseCard.courseName}
                                            </span>
                                            <h3 className="text-foreground font-bold text-xl">Tiến độ học tập</h3>
                                            <p className="mt-2 text-sm text-muted-foreground">{heroCourseCard.subtitle}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-3 mb-8">
                                        <div className="flex justify-between text-sm items-end">
                                            <span className="text-muted-foreground font-medium">Hoàn thành</span>
                                            <span className="font-bold text-foreground text-lg">{heroCourseCard.progress}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full relative" style={{ width: progressWidth }}>
                                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 pt-2">
                                            <div className="rounded-2xl bg-stone-50 px-3 py-3 border border-stone-100">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Mục tiêu</p>
                                                <p className="mt-1 text-sm font-bold text-foreground">IELTS {heroCourseCard.targetScore}</p>
                                            </div>
                                            <div className="rounded-2xl bg-stone-50 px-3 py-3 border border-stone-100">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Đã học</p>
                                                <p className="mt-1 text-sm font-bold text-foreground">{heroCourseCard.completedLessons}/{heroCourseCard.totalLessons} buổi</p>
                                            </div>
                                            <div className="rounded-2xl bg-stone-50 px-3 py-3 border border-stone-100">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tăng tốc</p>
                                                <p className="mt-1 text-sm font-bold text-emerald-600">{heroCourseCard.weeklyImprovement}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Next Class */}
                                    <div className="bg-stone-50/80 rounded-2xl p-4 flex items-center gap-4 border border-stone-100/50">
                                        <div className="bg-white p-2.5 rounded-xl shadow-sm text-red-500">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium mb-1">Lớp tiếp theo • {heroCourseCard.nextClass.day}</p>
                                            <p className="text-sm font-bold text-foreground">{heroCourseCard.nextClass.topic}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{heroCourseCard.nextClass.time} • {heroCourseCard.classRank}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {heroCourseCard.recentActivities.map((activity) => (
                                            <div key={`${activity.type}-${activity.title}`} className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white/70 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                                                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                                                </div>
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                                                    {activity.score}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card 2: Teacher Credibility */}
                                <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-5 shadow-xl shadow-black/5 border border-white lg:absolute lg:top-16 lg:-right-4 lg:w-[300px] z-10 group hover:-translate-y-1 transition-transform duration-500">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-stone-100">
                                            <img src={featuredTeacher.image} alt={featuredTeacher.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <h4 className="font-bold text-foreground">{featuredTeacher.name}</h4>
                                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">{featuredTeacher.role}</p>
                                        </div>
                                    </div>
                                    <p className="mb-4 text-sm text-foreground/75">{featuredTeacher.experience} • Chuyên môn {featuredTeacher.specialty}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                                            {featuredTeacher.badge}
                                        </span>
                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100 flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                            {featuredTeacher.rating}
                                        </span>
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
                                            {featuredTeacher.students}+ học viên
                                        </span>
                                    </div>
                                </div>

                                {/* Card 3: Testimonial Outcome */}
                                <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-black/5 border border-white lg:absolute lg:bottom-4 lg:left-12 lg:w-[420px] z-30 group hover:-translate-y-1 transition-transform duration-500">
                                    <div className="absolute top-6 right-6 text-stone-200">
                                        <Quote className="w-8 h-8 fill-current" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-inner">
                                            {featuredTestimonial.initials}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-foreground text-sm">{featuredTestimonial.author}</h4>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{featuredTestimonial.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed mb-5 pr-6">
                                        "{featuredTestimonial.content}"
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
                                        <TrendingUp className="w-4 h-4" />
                                        {featuredTestimonial.result}
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                        <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">Scroll</span>
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

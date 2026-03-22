import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ConsultationModal } from '@/components/common';
import { ArrowRight, Play, CheckCircle2, TrendingUp, Shield, Award, Star, Calendar, Quote } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { heroCourseCard, teachers, testimonials } from '../constants/landing-data';

const CATEGORIES = [
    {
        id: 'ielts',
        label: 'IELTS',
        theme: {
            badge: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
            iconBadge: 'bg-red-50 text-red-500 dark:bg-red-950/80 dark:text-red-300',
            progress: 'from-red-500 to-orange-400'
        },
        course: {
            ...heroCourseCard,
            subtitle: 'Tiếng Anh học thuật',
            targetPrefix: 'Mục tiêu: IELTS ',
        },
        teacher: teachers[0],
        testimonial: testimonials[0]
    },
    {
        id: 'mos',
        label: 'Tin học/MOS',
        theme: {
            badge: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
            iconBadge: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/80 dark:text-emerald-300',
            progress: 'from-emerald-500 to-teal-400'
        },
        course: {
            courseName: 'MOS Master',
            subtitle: 'Chứng chỉ tin học quốc tế',
            progress: 85,
            targetScore: '1000',
            targetPrefix: 'Mục tiêu: Điểm ',
            totalLessons: 12,
            completedLessons: 10,
            weeklyImprovement: '+200 pts',
            classRank: 'Top 5%',
            nextClass: { day: 'Thứ 4', time: '18:00', topic: 'Excel Data Analysis' },
            recentActivities: [
                { type: 'assignment', title: 'Pivot Table Practice', score: '100%', time: 'Hôm qua' },
                { type: 'quiz', title: 'Hàm VLOOKUP', score: '10/10', time: '3 ngày trước' },
            ]
        },
        teacher: teachers[2],
        testimonial: testimonials[1]
    },
    {
        id: 'comm',
        label: 'Giao tiếp',
        theme: {
            badge: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
            iconBadge: 'bg-blue-50 text-blue-500 dark:bg-blue-950/80 dark:text-blue-300',
            progress: 'from-blue-500 to-cyan-400'
        },
        course: {
            courseName: 'Business Comm',
            subtitle: 'Tiếng Anh Doanh nghiệp',
            progress: 55,
            targetScore: 'B2',
            targetPrefix: 'Mục tiêu: Cấp độ ',
            totalLessons: 36,
            completedLessons: 16,
            weeklyImprovement: '+Trôi chảy',
            classRank: 'Tiến bộ nhất',
            nextClass: { day: 'Thứ 6', time: '19:30', topic: 'Negotiation Skills' },
            recentActivities: [
                { type: 'assignment', title: 'Video Roleplay', score: 'Pass', time: 'Hôm qua' },
                { type: 'quiz', title: 'Business Emails', score: '18/20', time: 'Tuần trước' },
            ]
        },
        teacher: teachers[3],
        testimonial: testimonials[8]
    }
];

/**
 * Hero Section — Category Studio Canvas
 * Features multiple domains with auto-rotation, explicit data mapping, and accessible tabs.
 */
export const HeroSection = () => {
    const [ref, isInView] = useInView();
    const [showConsultation, setShowConsultation] = useState(false);
    
    // Auto-rotate logic for Category Studio
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (isHovered || isFocused || hasInteracted || shouldReduceMotion) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % CATEGORIES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isHovered, isFocused, hasInteracted, shouldReduceMotion]);
    const activeCategory = CATEGORIES[activeIndex];
    const activeCourse = activeCategory.course;
    const activeTeacher = activeCategory.teacher;
    const activeTestimonial = activeCategory.testimonial;
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
                            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-red-500/10 backdrop-blur
                            border border-border dark:border-red-500/20 rounded-full shadow-sm
                            transform transition-all duration-700 delay-100
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <span className="flex h-2 w-2" aria-hidden="true">
                                    <span className="motion-safe:animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                                </span>
                                <span className="text-xs font-medium text-muted-foreground dark:text-red-300 tracking-wide uppercase">
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
                                group-hover:shadow-md group-hover:border-red-200 dark:group-hover:border-red-800/50
                                group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-all duration-300">
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

                            {/* Proof Board Container: Stack up to lg, absolute positioning on xl to prevent clipping */}
                            {/* Proof Board Container: Category Studio Canvas */}
                            <div 
                                className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl shadow-black/5 dark:shadow-black/30 border border-white dark:border-white/10 relative z-20 w-full xl:w-[480px] mx-auto xl:mr-0 xl:ml-auto flex flex-col h-auto min-h-[580px] mt-12 lg:mt-0"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                            >
                                {/* Tabs Header */}
                                <div role="tablist" aria-label="Danh mục chương trình học" className="flex gap-1.5 mb-6 bg-stone-100/50 dark:bg-zinc-800/80 p-1.5 rounded-2xl">
                                    {CATEGORIES.map((cat, idx) => (
                                        <button
                                            key={cat.id}
                                            role="tab"
                                            aria-selected={activeIndex === idx}
                                            aria-controls={`panel-${cat.id}`}
                                            id={`tab-${cat.id}`}
                                            onClick={() => {
                                                setActiveIndex(idx);
                                                setHasInteracted(true);
                                            }}
                                            className={`relative flex-1 py-2.5 px-3 text-[13px] font-semibold rounded-xl transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${activeIndex === idx ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80 dark:hover:text-foreground'}`}
                                            aria-label={`Xem lộ trình ${cat.label}`}
                                        >
                                            {activeIndex === idx && (
                                                <motion.div 
                                                    layoutId="heroTabBg"
                                                    className="absolute inset-0 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-stone-200/50 dark:border-white/10"
                                                    initial={false}
                                                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-20">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Stage Body */}
                                <div 
                                    role="tabpanel"
                                    id={`panel-${activeCategory.id}`}
                                    aria-labelledby={`tab-${activeCategory.id}`}
                                    className="relative flex-1 min-h-[360px]"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeCategory.id}
                                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25 }}
                                            className="flex flex-col h-full"
                                        >
                                            <div className="flex justify-between items-start mb-5">
                                                <div>
                                                    <span className={`inline-block px-3 py-1 ${activeCategory.theme.badge} rounded-full text-[11px] font-bold mb-2.5 tracking-wide uppercase`}>
                                                        {activeCourse.courseName}
                                                    </span>
                                                    <h3 className="text-foreground font-bold text-xl leading-tight">Lộ trình nổi bật</h3>
                                                    <p className="mt-1 text-sm text-muted-foreground">{activeCourse.subtitle}</p>
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl ${activeCategory.theme.iconBadge} flex items-center justify-center shadow-inner shrink-0`}>
                                                    <TrendingUp className="w-6 h-6" />
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-sm items-end">
                                                    <span className="text-muted-foreground font-medium">Hoàn thành</span>
                                                    <span className="font-bold text-foreground text-lg">{activeCourse.progress}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                                    <motion.div 
                                                        className={`h-full bg-gradient-to-r ${activeCategory.theme.progress} rounded-full`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${activeCourse.progress}%` }}
                                                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 1, delay: 0.1, ease: 'easeOut' }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2.5 pt-2">
                                                    <div className="rounded-xl bg-stone-50 dark:bg-zinc-800/80 px-3 py-2.5 border border-stone-100/60 dark:border-white/10">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mục tiêu</p>
                                                        <p className="mt-1 text-xs font-bold text-foreground truncate">{activeCourse.targetPrefix}{activeCourse.targetScore}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-stone-50 dark:bg-zinc-800/80 px-3 py-2.5 border border-stone-100/60 dark:border-white/10">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Đã học</p>
                                                        <p className="mt-1 text-xs font-bold text-foreground">{activeCourse.completedLessons}/{activeCourse.totalLessons} buổi</p>
                                                    </div>
                                                    <div className="rounded-xl bg-stone-50 dark:bg-zinc-800/80 px-3 py-2.5 border border-stone-100/60 dark:border-white/10">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tăng tốc</p>
                                                        <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">{activeCourse.weeklyImprovement}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Teacher & Next Class Split */}
                                            <div className="grid grid-cols-2 gap-3 mb-5">
                                                <div className="bg-white/60 dark:bg-zinc-800/70 rounded-[1.25rem] p-3.5 border border-stone-100/80 dark:border-white/10 shadow-sm flex flex-col justify-center transition-all hover:bg-white/80 dark:hover:bg-zinc-800">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-zinc-700 shadow-sm shrink-0 bg-stone-100 dark:bg-zinc-700">
                                                            <img src={activeTeacher.image} alt={activeTeacher.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <p className="text-xs font-bold text-foreground truncate">{activeTeacher.name}</p>
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground truncate">{activeTeacher.badge}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                        <span className="font-semibold text-foreground">{activeTeacher.rating}</span>
                                                        <span>• {activeTeacher.students}+ hv</span>
                                                    </div>
                                                </div>

                                                <div className="bg-white/60 dark:bg-zinc-800/70 rounded-[1.25rem] p-3.5 border border-stone-100/80 dark:border-white/10 shadow-sm flex flex-col justify-center transition-all hover:bg-white/80 dark:hover:bg-zinc-800">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Calendar className="w-4 h-4 text-red-500" />
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lớp tiếp theo</span>
                                                    </div>
                                                    <p className="text-[13px] font-bold text-foreground truncate mb-0.5">{activeCourse.nextClass.topic}</p>
                                                    <p className="text-[11px] text-muted-foreground">{activeCourse.nextClass.day} • {activeCourse.nextClass.time}</p>
                                                </div>
                                            </div>

                                            {/* Activities */}
                                            <div className="space-y-2.5">
                                                {activeCourse.recentActivities.map((activity, idx) => (
                                                    <div key={idx} className="flex items-center justify-between rounded-xl border border-stone-100/80 dark:border-white/10 bg-white/60 dark:bg-zinc-800/70 px-4 py-2.5 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-zinc-800">
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">{activity.time}</p>
                                                        </div>
                                                        <span className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                                                            {activity.score}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Compact Testimonial Ticker */}
                                <div className="mt-6 pt-5 border-t border-stone-100 dark:border-white/10 relative overflow-hidden h-[100px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`test-${activeCategory.id}`}
                                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0 flex items-center gap-4 bg-stone-50/80 dark:bg-zinc-800/80 rounded-2xl p-3 border border-stone-200/50 dark:border-white/10"
                                        >
                                            <div className="relative shrink-0">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${activeTestimonial.color || 'bg-emerald-500'}`}>
                                                    {activeTestimonial.initials}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-1.5 shadow-sm border border-stone-100 dark:border-white/10">
                                                    <Quote className="w-3 h-3 text-emerald-600 dark:text-emerald-300 fill-current" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                                                <p className="text-[13px] text-foreground/80 leading-snug line-clamp-2 font-medium">"{activeTestimonial.content}"</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs font-bold text-foreground">{activeTestimonial.author}</span>
                                                    <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-zinc-600" />
                                                    <span 
                                                        className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--badge-bg)] text-[var(--badge-color)] dark:bg-zinc-700 dark:text-zinc-200" 
                                                        style={{ 
                                                            '--badge-bg': activeTestimonial.resultColor ? `${activeTestimonial.resultColor}15` : '#ecfdf5', 
                                                            '--badge-color': activeTestimonial.resultColor || '#047857' 
                                                        }}
                                                    >
                                                        {activeTestimonial.result}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                        </div>
                    </div>
                </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
                    <div className="flex flex-col items-center gap-2 opacity-60">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cuộn xuống</span>
                        <div className="w-px h-8 bg-gradient-to-b from-zinc-400 to-transparent" />
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

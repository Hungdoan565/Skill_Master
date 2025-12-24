import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Clock, CheckCircle2, Award, Star, TrendingUp, FileText, Brain } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { VideoModal } from '../components/video-modal';
import { studentAvatars, introVideo, heroCourseCard } from '../constants/landing-data';

/**
 * Enhanced Hero Section Component
 * Features: Video modal, real student avatars, impressive course card
 */
export const HeroSection = () => {
    const [ref, isInView] = useInView();
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    return (
        <>
            <section
                ref={ref}
                className="relative min-h-screen flex items-center pt-20 overflow-hidden"
                aria-label="Hero section"
            >
                {/* Background Elements */}
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
                                    Đăng ký khóa mới — Giảm 30%
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
                                <Link
                                    to="/register"
                                    className="group inline-flex items-center gap-3 px-8 py-4 
                           bg-red-600 text-white text-base font-semibold rounded-full
                           shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30
                           hover:bg-red-700 active:scale-[0.98] transition-all duration-300"
                                    aria-label="Đăng ký học thử miễn phí"
                                >
                                    Đăng ký học thử miễn phí
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                </Link>

                                {/* Video Button - NOW FUNCTIONAL */}
                                <button
                                    onClick={() => setIsVideoOpen(true)}
                                    className="group inline-flex items-center gap-3 px-6 py-4 
                           text-zinc-700 font-medium hover:text-zinc-900 transition-colors"
                                    aria-label="Xem video giới thiệu"
                                >
                                    <span className="flex items-center justify-center w-12 h-12 rounded-full 
                                bg-white border border-stone-200 shadow-sm
                                group-hover:shadow-md group-hover:border-red-200 
                                group-hover:bg-red-50 transition-all duration-300">
                                        <Play className="w-5 h-5 text-zinc-700 group-hover:text-red-600 ml-0.5"
                                            fill="currentColor" aria-hidden="true" />
                                    </span>
                                    Xem video giới thiệu
                                </button>
                            </div>

                            {/* Trust Indicators - REAL AVATARS */}
                            <div className={`flex items-center gap-8 pt-8 border-t border-stone-200
                            transform transition-all duration-700 delay-500
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex -space-x-3">
                                    {studentAvatars.map((avatar, i) => (
                                        <img
                                            key={i}
                                            src={avatar}
                                            alt={`Học viên ${i + 1}`}
                                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm 
                               object-cover hover:scale-110 hover:z-10 transition-transform"
                                            loading="lazy"
                                        />
                                    ))}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">2,847+ học viên</p>
                                    <p className="text-sm text-zinc-500">đã tin tưởng đăng ký</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Visual - ENHANCED Course Preview Card */}
                        <div className={`lg:col-span-5 transform transition-all duration-1000 delay-300
                          ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
                            <div className="relative">
                                {/* Main Card - ENHANCED */}
                                <div className="relative bg-white rounded-3xl shadow-2xl shadow-zinc-900/10 
                             border border-stone-100 overflow-hidden 
                             hover:shadow-3xl hover:shadow-zinc-900/15 transition-shadow duration-500">
                                    {/* Card Header */}
                                    <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-red-50 to-orange-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 
                                     flex items-center justify-center shadow-lg shadow-red-500/30">
                                                    <BookOpen className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 text-lg">{heroCourseCard.courseName}</p>
                                                    <p className="text-xs text-zinc-500">{heroCourseCard.subtitle}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
                                                Đang mở
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 space-y-5">
                                        {/* Circular Progress */}
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-20 h-20">
                                                <svg className="w-20 h-20 transform -rotate-90">
                                                    <circle cx="40" cy="40" r="35" stroke="#E7E5E4" strokeWidth="6" fill="none" />
                                                    <circle
                                                        cx="40" cy="40" r="35"
                                                        stroke="url(#progressGradient)"
                                                        strokeWidth="6"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${heroCourseCard.progress * 2.2} 220`}
                                                    />
                                                    <defs>
                                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#EF4444" />
                                                            <stop offset="100%" stopColor="#F97316" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xl font-bold text-zinc-900">{heroCourseCard.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-zinc-500">Tiến độ học tập</p>
                                                <p className="text-lg font-semibold text-zinc-900">
                                                    {heroCourseCard.completedLessons}/{heroCourseCard.totalLessons} buổi
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-green-600">
                                                    <TrendingUp className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Đúng tiến độ</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                                                <div className="flex items-center gap-2 text-blue-600 mb-1">
                                                    <Star className="w-4 h-4" />
                                                    <span className="text-xs font-medium">Mục tiêu</span>
                                                </div>
                                                <p className="text-2xl font-bold text-zinc-900">{heroCourseCard.targetScore}</p>
                                                <p className="text-xs text-zinc-500">IELTS Band</p>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                                                <div className="flex items-center gap-2 text-purple-600 mb-1">
                                                    <Brain className="w-4 h-4" />
                                                    <span className="text-xs font-medium">Xếp hạng</span>
                                                </div>
                                                <p className="text-2xl font-bold text-zinc-900">{heroCourseCard.classRank}</p>
                                                <p className="text-xs text-zinc-500">trong lớp</p>
                                            </div>
                                        </div>

                                        {/* Recent Activities */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hoạt động gần đây</p>
                                            {heroCourseCard.recentActivities.map((activity, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-zinc-400" />
                                                        <span className="text-sm text-zinc-700">{activity.title}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-semibold text-green-600">{activity.score}</span>
                                                        <p className="text-xs text-zinc-400">{activity.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Instructor & Next Class */}
                                        <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl">
                                            <img
                                                src={heroCourseCard.instructor.avatar}
                                                alt={heroCourseCard.instructor.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white">{heroCourseCard.instructor.name}</p>
                                                <div className="flex items-center gap-2 text-zinc-400 text-xs mt-0.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{heroCourseCard.nextClass.day}, {heroCourseCard.nextClass.time}</span>
                                                    <span className="text-zinc-600">•</span>
                                                    <span>{heroCourseCard.nextClass.topic}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements - Repositioned to avoid obscuring content */}
                                <div className="absolute top-20 -right-12 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl 
                             border border-stone-100 animate-float z-20 hidden lg:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">{heroCourseCard.weeklyImprovement}</p>
                                            <p className="text-xs text-zinc-500">tuần này</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-28 -left-12 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl 
                             border border-stone-100 animate-float-delayed z-20 hidden lg:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">128+</p>
                                            <p className="text-xs text-zinc-500">bài tập đã làm</p>
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

            {/* Video Modal */}
            <VideoModal
                isOpen={isVideoOpen}
                onClose={() => setIsVideoOpen(false)}
                videoId={introVideo.youtubeId}
                title={introVideo.title}
            />
        </>
    );
};

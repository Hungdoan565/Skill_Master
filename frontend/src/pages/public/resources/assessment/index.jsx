import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Globe, Briefcase, Monitor, Clock, Users, ArrowRight,
    CheckCircle, Star, Play, Sparkles, Target
} from 'lucide-react';
import { SEOHead } from '@/components/common';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';
import { supabase } from '@/lib/supabaseClient';

// ============================================
// ASSESSMENT LANDING PAGE
// Swiss Minimalism Design + Premium Feel
// ============================================

// Icon mapping
const iconMap = {
    Globe: Globe,
    Briefcase: Briefcase,
    Monitor: Monitor,
};

// Intersection Observer Hook
const useInView = (options = {}) => {
    const [ref, setRef] = useState(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!ref) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, ...options });

        observer.observe(ref);
        return () => observer.disconnect();
    }, [ref]);

    return [setRef, isInView];
};

// ============================================
// TEST CARD COMPONENT
// ============================================
const TestCard = ({ test, index, isInView }) => {
    const IconComponent = iconMap[test.icon_name] || Globe;
    const categoryColors = {
        ielts: { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
        toeic: { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
        office: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    };
    const colors = categoryColors[test.category] || categoryColors.ielts;

    return (
        <div
            className={`group relative bg-white border-2 border-neutral-200 rounded-none overflow-hidden
                       transition-all duration-500 hover:border-neutral-900 hover:shadow-xl
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${100 + index * 100}ms` }}
        >
            {/* Featured Badge */}
            {test.is_featured && (
                <div className="absolute top-0 right-0 bg-[#FF4D00] text-white text-[10px] font-bold 
                              uppercase tracking-wider px-3 py-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Phổ biến
                </div>
            )}

            {/* Top Color Bar */}
            <div className={`h-1 ${colors.bg.replace('50', '500')}`} />

            {/* Card Content */}
            <div className="p-6 lg:p-8">
                {/* Icon & Category */}
                <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 ${colors.bg} flex items-center justify-center`}>
                        <IconComponent className={`w-7 h-7 ${colors.accent}`} />
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider ${colors.badge}`}>
                        {test.category}
                    </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-2 
                             group-hover:text-[#FF4D00] transition-colors">
                    {test.title}
                </h3>
                <p className="text-neutral-500 leading-relaxed mb-6">
                    {test.short_description || test.description?.slice(0, 100)}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-6 text-sm text-neutral-500">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{test.duration_minutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4" />
                        <span>{test.total_questions} câu</span>
                    </div>
                </div>

                {/* CTA Button */}
                <Link
                    to={`/assessment/${test.slug}`}
                    className="w-full flex items-center justify-center gap-2 py-4 
                             bg-neutral-900 text-white font-semibold uppercase tracking-wider text-sm
                             hover:bg-[#FF4D00] transition-colors duration-300 group/btn"
                >
                    <Play className="w-4 h-4" />
                    Bắt đầu làm bài
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 
                                         group-hover/btn:translate-x-0 transition-all" />
                </Link>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/5 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};

// ============================================
// HERO SECTION
// ============================================
const HeroSection = () => {
    const [ref, isInView] = useInView();

    const benefits = [
        'Kết quả ngay lập tức',
        'Gợi ý khóa học phù hợp',
        'Hoàn toàn miễn phí',
    ];

    return (
        <section ref={ref} className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-neutral-50 border-b border-neutral-200">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left - Content */}
                    <div className={`transform transition-all duration-700 
                                  ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 
                                      text-sm text-neutral-600 mb-6">
                            <Sparkles className="w-4 h-4 text-[#FF4D00]" />
                            Đánh giá năng lực miễn phí
                        </div>

                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 
                                     tracking-tight leading-[1.1] mb-6">
                            Bạn đang ở<br />
                            <span className="text-[#FF4D00]">trình độ nào?</span>
                        </h1>

                        <p className="text-lg lg:text-xl text-neutral-600 leading-relaxed mb-8 max-w-lg">
                            Làm bài test nhanh để biết chính xác trình độ hiện tại và nhận lộ trình học tập
                            được cá nhân hóa cho bạn.
                        </p>

                        {/* Benefits */}
                        <div className="flex flex-wrap gap-4 mb-8">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    {benefit}
                                </div>
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-8 pt-8 border-t border-neutral-200">
                            <div>
                                <span className="text-3xl font-bold text-neutral-900">10K+</span>
                                <p className="text-sm text-neutral-500 mt-1">Người đã test</p>
                            </div>
                            <div>
                                <span className="text-3xl font-bold text-neutral-900">95%</span>
                                <p className="text-sm text-neutral-500 mt-1">Hài lòng kết quả</p>
                            </div>
                            <div>
                                <span className="text-3xl font-bold text-neutral-900">3</span>
                                <p className="text-sm text-neutral-500 mt-1">Loại bài test</p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Visual */}
                    <div className={`relative transform transition-all duration-700 delay-200
                                  ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="relative bg-white p-8 border-2 border-neutral-200">
                            {/* Preview Card */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                        Câu 15/30
                                    </span>
                                    <span className="px-3 py-1 bg-[#FF4D00]/10 text-[#FF4D00] text-xs font-semibold">
                                        12:45 còn lại
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-neutral-100 overflow-hidden">
                                    <div className="h-full bg-[#FF4D00] w-1/2 transition-all" />
                                </div>

                                {/* Sample Question */}
                                <div className="py-6 border-t border-neutral-100">
                                    <p className="text-lg font-medium text-neutral-900 mb-6">
                                        If I _____ rich, I would travel the world.
                                    </p>
                                    <div className="space-y-3">
                                        {['am', 'was', 'were', 'be'].map((option, i) => (
                                            <div
                                                key={i}
                                                className={`p-4 border-2 cursor-pointer transition-all
                                                    ${i === 2
                                                        ? 'border-[#FF4D00] bg-[#FF4D00]/5'
                                                        : 'border-neutral-200 hover:border-neutral-400'}`}
                                            >
                                                <span className="font-medium text-neutral-900">
                                                    {String.fromCharCode(65 + i)}. {option}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FF4D00]/10 -z-10" />
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-neutral-900 -z-10" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ============================================
// TESTS GRID SECTION
// ============================================
const TestsSection = ({ tests, loading }) => {
    const [ref, isInView] = useInView();

    return (
        <section ref={ref} className="py-16 lg:py-24 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className={`max-w-2xl mb-12 transform transition-all duration-500
                              ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                        Chọn bài test phù hợp
                    </h2>
                    <p className="text-neutral-500">
                        Mỗi bài test được thiết kế riêng cho từng mục tiêu học tập.
                        Hoàn thành trong vài phút để nhận kết quả chính xác.
                    </p>
                </div>

                {/* Tests Grid */}
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-neutral-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tests.map((test, index) => (
                            <TestCard
                                key={test.id}
                                test={test}
                                index={index}
                                isInView={isInView}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && tests.length === 0 && (
                    <div className="text-center py-16">
                        <Monitor className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-500">Chưa có bài test nào. Vui lòng quay lại sau.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

// ============================================
// HOW IT WORKS SECTION
// ============================================
const HowItWorksSection = () => {
    const [ref, isInView] = useInView();

    const steps = [
        { num: '01', title: 'Chọn bài test', desc: 'Chọn loại test phù hợp với mục tiêu của bạn' },
        { num: '02', title: 'Làm bài', desc: 'Trả lời các câu hỏi trong thời gian quy định' },
        { num: '03', title: 'Xem kết quả', desc: 'Nhận điểm số và phân tích chi tiết ngay lập tức' },
        { num: '04', title: 'Nhận gợi ý', desc: 'Xem các khóa học được đề xuất dựa trên kết quả' },
    ];

    return (
        <section ref={ref} className="py-16 lg:py-24 bg-neutral-900 text-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className={`text-center max-w-2xl mx-auto mb-12 transform transition-all duration-500
                              ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                        Quy trình đơn giản
                    </h2>
                    <p className="text-neutral-400">
                        Chỉ mất vài phút để hoàn thành và nhận kết quả chi tiết
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`relative p-6 border border-neutral-800 transform transition-all duration-500
                                      hover:border-neutral-600 hover:bg-neutral-800/50
                                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: `${200 + i * 100}ms` }}
                        >
                            <span className="text-5xl font-bold text-neutral-700 mb-4 block">
                                {step.num}
                            </span>
                            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                            <p className="text-sm text-neutral-400">{step.desc}</p>

                            {/* Arrow to next */}
                            {i < steps.length - 1 && (
                                <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 
                                                     transform -translate-y-1/2 text-neutral-700 w-6 h-6" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export const AssessmentPage = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const { data, error } = await supabase
                    .from('assessment_tests')
                    .select('*')
                    .eq('is_active', true)
                    .order('is_featured', { ascending: false })
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setTests(data || []);
            } catch (err) {
                console.error('Error fetching tests:', err);
                // Fallback to mock data if table doesn't exist
                setTests([
                    {
                        id: '1',
                        title: 'Kiểm tra trình độ IELTS',
                        slug: 'ielts-placement',
                        category: 'ielts',
                        short_description: 'Đánh giá trình độ theo chuẩn IELTS',
                        icon_name: 'Globe',
                        duration_minutes: 30,
                        total_questions: 30,
                        is_featured: true,
                    },
                    {
                        id: '2',
                        title: 'Kiểm tra trình độ TOEIC',
                        slug: 'toeic-placement',
                        category: 'toeic',
                        short_description: 'Đánh giá trình độ theo chuẩn TOEIC',
                        icon_name: 'Briefcase',
                        duration_minutes: 25,
                        total_questions: 25,
                        is_featured: true,
                    },
                    {
                        id: '3',
                        title: 'Kiểm tra trình độ Tin học',
                        slug: 'office-placement',
                        category: 'office',
                        short_description: 'Đánh giá kỹ năng tin học văn phòng',
                        icon_name: 'Monitor',
                        duration_minutes: 20,
                        total_questions: 20,
                        is_featured: false,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Kiểm tra Trình độ"
                description="Làm bài test miễn phí để đánh giá trình độ tiếng Anh hoặc tin học. Nhận kết quả ngay và gợi ý khóa học phù hợp."
            />

            <PublicHeader />

            <main>
                <HeroSection />
                <TestsSection tests={tests} loading={loading} />
                <HowItWorksSection />
            </main>

            <Footer />
        </div>
    );
};

export default AssessmentPage;

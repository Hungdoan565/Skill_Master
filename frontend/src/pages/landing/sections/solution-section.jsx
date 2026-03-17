import React, { useState } from 'react';
import { SmartImage } from '@/components/common';
import { ConsultationModal } from '@/components/common';
import { ArrowRight, BarChart3, Brain, Zap, CheckCircle2 } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { landingImages } from '../constants/landing-data';

/**
 * Solution Section — Alternating Feature Rows
 * Linear/Notion style — each feature gets full width treatment
 * Light background, continues warm momentum from Problem section
 * 3 features with numbered sections + real screenshots
 */

const features = [
    {
        number: '01',
        badge: 'Minh bạch 100%',
        badgeColor: 'bg-blue-100 text-blue-700',
        icon: BarChart3,
        iconColor: 'bg-blue-600',
        title: 'Dashboard học tập cá nhân',
        headline: 'Mỗi học viên có bảng theo dõi riêng — minh bạch hoàn toàn.',
        description: 'Điểm số, tiến độ bài tập, lịch sử điểm danh, phản hồi từ giáo viên — tất cả real-time. Phụ huynh cũng có thể theo dõi từ xa qua tài khoản riêng.',
        bullets: [
            'Theo dõi điểm số và tiến độ qua từng buổi học',
            'Phụ huynh có tài khoản riêng để giám sát',
            'Phản hồi chi tiết từ giáo viên sau mỗi buổi',
        ],
        imageKey: 'progress',
        imageSource: 'conversion',
    },
    {
        number: '02',
        badge: 'Hỗ trợ 24/7',
        badgeColor: 'bg-purple-100 text-purple-700',
        icon: Brain,
        iconColor: 'bg-purple-600',
        title: 'AI Chatbot Molly',
        headline: 'Trợ lý AI sẵn sàng giúp bạn bất kỳ lúc nào.',
        description: 'Molly giải đáp thắc mắc, gợi ý tài liệu phù hợp trình độ, và luyện Speaking cùng bạn. Khi cần chuyên gia, Molly tự động kết nối với bộ phận hỗ trợ.',
        bullets: [
            'Giải đáp thắc mắc ngữ pháp, từ vựng tức thì',
            'Luyện Speaking qua hội thoại AI',
            'Tự động chuyển sang chuyên gia khi cần',
        ],
        imageKey: 'mollyChatbot',
        imageSource: 'hero',
    },
    {
        number: '03',
        badge: 'Tất cả trong 1',
        badgeColor: 'bg-red-100 text-red-700',
        icon: Zap,
        iconColor: 'bg-red-600',
        title: 'Hệ thống quản lý toàn diện',
        headline: 'Lịch học, điểm danh, thanh toán — một nền tảng duy nhất.',
        description: 'Không cần Excel, WhatsApp, hay các phần mềm rời rạc. Skill Master tích hợp toàn bộ quy trình vận hành trung tâm: từ sắp lịch, quản lý lớp, đến bảng lương giáo viên.',
        bullets: [
            'Quản lý lớp học, lịch dạy, điểm danh tự động',
            'Thanh toán học phí online, xuất hóa đơn',
            'Bảng lương giáo viên tính tự động theo buổi dạy',
        ],
        imageKey: 'productMockup',
        imageSource: 'hero',
    },
];

const FeatureRow = ({ feature, index, isReversed }) => {
    const [ref, isInView] = useInView();
    const Icon = feature.icon;
    const image = landingImages[feature.imageSource]?.[feature.imageKey];

    return (
        <div
            ref={ref}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center
                ${index > 0 ? 'pt-24 lg:pt-32' : ''}`}
        >
            {/* Text Side */}
            <div className={`space-y-6 ${isReversed ? 'lg:order-2' : 'lg:order-1'}
                transform transition-all duration-700 delay-100
                ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Number + Badge */}
                <div className="flex items-center gap-3">
                    <span className="font-display text-5xl font-bold text-stone-200 select-none">
                        {feature.number}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${feature.badgeColor}`}>
                        {feature.badge}
                    </span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${feature.iconColor} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                        {feature.title}
                    </span>
                </div>

                {/* Headline */}
                <h3 className="font-display text-3xl lg:text-4xl font-bold text-zinc-900 tracking-tight leading-[1.2]">
                    {feature.headline}
                </h3>

                {/* Description */}
                <p className="text-lg text-zinc-500 leading-relaxed">
                    {feature.description}
                </p>

                {/* Bullet points */}
                <ul className="space-y-3 pt-2">
                    {feature.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-zinc-700">{bullet}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Image Side */}
            <div className={`${isReversed ? 'lg:order-1' : 'lg:order-2'}
                transform transition-all duration-700 delay-300
                ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <div className="relative group">
                    {/* Screenshot Container */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-900/10
                        border border-stone-200 bg-white
                        group-hover:shadow-3xl group-hover:shadow-zinc-900/15 
                        group-hover:-translate-y-1 transition-all duration-500">
                        {image && (
                            <SmartImage
                                src={image}
                                alt={feature.title}
                                className="w-full h-full object-cover 
                                    group-hover:scale-[1.02] transition-transform duration-700"
                                containerClassName="w-full aspect-[4/3]"
                            />
                        )}
                    </div>

                    {/* Subtle glow behind image */}
                    <div className={`absolute -inset-4 -z-10 rounded-3xl blur-2xl opacity-30 
                        group-hover:opacity-40 transition-opacity duration-500
                        ${feature.iconColor.replace('bg-', 'bg-')}/20`} 
                        aria-hidden="true" />
                </div>
            </div>
        </div>
    );
};

export const SolutionSection = () => {
    const [ref, isInView] = useInView();
    const [showConsultation, setShowConsultation] = useState(false);

    return (
        <>
            <section ref={ref} className="py-28 lg:py-32 bg-white overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    {/* Section Header */}
                    <div className={`text-center max-w-3xl mx-auto mb-20 transform transition-all duration-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <span className="inline-block px-4 py-1.5 bg-red-600 text-white text-xs font-medium 
                            rounded-full uppercase tracking-wider mb-6">
                            Giải pháp
                        </span>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
                            Skill Master giải quyết
                            <br />
                            <span className="text-zinc-400">tất cả cho bạn</span>
                        </h2>
                        <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
                            Một nền tảng duy nhất cho cả quản lý trung tâm và trải nghiệm học tập.
                            Không phải phần mềm rời rạc — mà là hệ sinh thái hoàn chỉnh.
                        </p>
                    </div>

                    {/* Feature Rows — Alternating Layout */}
                    {features.map((feature, index) => (
                        <FeatureRow
                            key={feature.number}
                            feature={feature}
                            index={index}
                            isReversed={index % 2 === 1}
                        />
                    ))}

                    {/* Bottom Divider + CTA */}
                    <div className={`mt-24 pt-16 border-t border-stone-200 text-center
                        transform transition-all duration-700 delay-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <p className="text-lg text-zinc-500 mb-6">
                            Sẵn sàng trải nghiệm nền tảng?
                        </p>
                        <button
                            onClick={() => setShowConsultation(true)}
                            className="group inline-flex items-center gap-3 px-8 py-4 
                                bg-red-600 text-white text-base font-semibold rounded-full
                                shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30
                                hover:bg-red-700 active:scale-[0.98] transition-all duration-300"
                            id="solution-cta"
                        >
                            Nhận tư vấn miễn phí
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </section>

            <ConsultationModal
                isOpen={showConsultation}
                onClose={() => setShowConsultation(false)}
                source="solution-section"
            />
        </>
    );
};

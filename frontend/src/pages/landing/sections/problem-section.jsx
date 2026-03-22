import React, { useState } from 'react';
import { ConsultationModal } from '@/components/common';
import { ArrowRight, MapPinOff, BookX, EyeOff } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { painPoints } from '../constants/landing-data';

// Icon mapping — proper Lucide icons, not emojis
const iconMap = {
    MapPinOff,
    BookX,
    EyeOff,
};

// Accent colors per card
const accentMap = [
    { bg: 'bg-red-50 dark:bg-red-950/30', iconBg: 'bg-red-100 dark:bg-red-900/40', iconColor: 'text-red-600 dark:text-red-400', border: 'hover:border-red-200 dark:hover:border-red-800' },
    { bg: 'bg-amber-50 dark:bg-amber-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400', border: 'hover:border-amber-200 dark:hover:border-amber-800' },
    { bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400', border: 'hover:border-blue-200 dark:hover:border-blue-800' },
];

/**
 * Problem Section — Empathy-first
 * Highlights user pain points before presenting the solution
 * Uses numbered cards with proper icons (no emojis)
 */
export const ProblemSection = () => {
    const [ref, isInView] = useInView();
    const [showConsultation, setShowConsultation] = useState(false);

    return (
        <>
            <section ref={ref} className="py-28 lg:py-32 bg-[#fdf9f2] dark:bg-zinc-900 overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    {/* Section Header */}
                    <div className={`text-center max-w-3xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
                            Có quen không?
                        </span>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                            Bạn đang gặp vấn đề này
                            <br />
                            <span className="text-muted-foreground/70">khi học Anh ngữ & Tin học?</span>
                        </h2>
                    </div>

                    {/* Pain Points Grid */}
                    <div className="mt-16 grid md:grid-cols-3 gap-8">
                        {painPoints.map((point, index) => {
                            const Icon = iconMap[point.icon];
                            const accent = accentMap[index];

                            return (
                                <div
                                    key={index}
                                    className={`group relative p-8 bg-card rounded-3xl border border-border
                                    ${accent.border} hover:shadow-xl hover:shadow-black/5 dark:shadow-black/20
                                    transition-all duration-500 hover:-translate-y-1
                                    transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                    style={{ transitionDelay: `${200 + index * 150}ms` }}
                                >
                                    {/* Numbered badge + Icon */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl ${accent.iconBg} flex items-center justify-center
                                            shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            {Icon && <Icon className={`w-7 h-7 ${accent.iconColor}`} strokeWidth={1.5} />}
                                        </div>
                                        <span className="text-6xl font-display font-bold text-stone-100 dark:text-zinc-800 leading-none select-none
                                            group-hover:text-stone-200 dark:group-hover:text-zinc-700 transition-colors">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <h3 className="font-display text-xl font-bold text-foreground mb-3">
                                        {point.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {point.description}
                                    </p>

                                    {/* Bottom accent line */}
                                    <div className={`absolute bottom-0 left-8 right-8 h-0.5 ${accent.iconBg} rounded-full
                                        scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Transition CTA */}
                    <div className={`mt-16 text-center transform transition-all duration-700 delay-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <p className="text-lg text-muted-foreground mb-6">
                            Nếu bạn đã từng trải qua những điều trên — chúng tôi hiểu.
                        </p>
                        <button
                            onClick={() => setShowConsultation(true)}
                            className="group inline-flex items-center gap-3 px-8 py-4 
                       bg-zinc-900 text-white text-base font-semibold rounded-full
                       shadow-lg shadow-zinc-900/25 hover:shadow-xl hover:bg-zinc-800
                       active:scale-[0.98] transition-all duration-300"
                            id="problem-cta"
                        >
                            Tìm giải pháp cho bạn
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </section>

            <ConsultationModal
                isOpen={showConsultation}
                onClose={() => setShowConsultation(false)}
                source="problem-section"
            />
        </>
    );
};

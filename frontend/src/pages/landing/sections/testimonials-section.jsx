import React, { useRef } from 'react';
import { Quote, Star, ArrowRight } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { testimonials } from '../constants/landing-data';

/**
 * Testimonials — B + C hybrid
 * 
 * Top: Center hero spotlight (1 featured card + 2 flanking compact cards)
 * Bottom: Two-row infinite marquee scroll (opposite directions)
 */

// ── Mini compact card for the flanking positions ──────────────────────
const CompactCard = ({ t }) => (
    <div className="flex-1 p-5 bg-card rounded-2xl border border-border shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-4">
            "{t.content}"
        </p>
        <div>
            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full text-white mb-3"
                style={{ backgroundColor: t.resultColor || '#374151' }}>
                {t.result}
            </span>
            <div className="flex items-center gap-2.5 pt-3 border-t border-border/50">
                <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-bold text-xs">{t.initials}</span>
                </div>
                <div>
                    <p className="text-xs font-semibold text-foreground">{t.author}</p>
                    <p className="text-[11px] text-muted-foreground/70">{t.role}</p>
                </div>
            </div>
        </div>
    </div>
);

// ── Featured hero card ────────────────────────────────────────────────
const FeaturedCard = ({ t }) => (
    <div className="relative bg-card rounded-3xl border border-border shadow-xl p-8 md:p-10 flex flex-col gap-6">
        {/* Decorative huge quote mark */}
        <div className="absolute -top-5 -left-2 text-[120px] font-serif text-stone-100 leading-none select-none"
            aria-hidden="true">"</div>

        {/* Stars */}
        <div className="flex items-center gap-1 relative z-10">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
        </div>

        {/* Quote text — big and prominent */}
        <blockquote className="relative z-10 text-xl md:text-2xl font-medium text-foreground leading-relaxed">
            "{t.content}"
        </blockquote>

        {/* Result badge — score with arrow */}
        <div className="relative z-10 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: t.resultColor || '#374151' }}>
                <ArrowRight className="w-4 h-4" />
                {t.result}
            </span>
            <span className="text-muted-foreground/70 text-sm">Kết quả thực tế sau khoá học</span>
        </div>

        {/* Author */}
        <div className="relative z-10 flex items-center gap-4 pt-6 border-t border-border/50">
            <div className={`w-14 h-14 rounded-2xl ${t.color} flex items-center justify-center shrink-0 shadow-md`}>
                <span className="text-white font-bold text-lg">{t.initials}</span>
            </div>
            <div>
                <p className="font-bold text-foreground text-lg">{t.author}</p>
                <p className="text-muted-foreground">{t.role}</p>
            </div>
        </div>
    </div>
);

// ── Marquee card (compact horizontal) ────────────────────────────────
const MarqueeCard = ({ t }) => (
    <div className="shrink-0 w-72 mx-3 p-4 bg-card rounded-2xl border border-border shadow-sm 
        flex flex-col gap-3 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: t.resultColor || '#374151' }}>
                {t.result}
            </span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">"{t.content}"</p>
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <div className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                <span className="text-white font-bold text-[10px]">{t.initials}</span>
            </div>
            <div>
                <p className="text-xs font-semibold text-foreground">{t.author}</p>
                <p className="text-[10px] text-muted-foreground/70">{t.role}</p>
            </div>
        </div>
    </div>
);

// ── Marquee row (CSS animation) ───────────────────────────────────────
const MarqueeRow = ({ items, reverse = false }) => {
    // Duplicate items for seamless loop
    const doubled = [...items, ...items];

    return (
        <div className="relative overflow-hidden">
            {/* Edge fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10
                bg-gradient-to-r from-stone-50 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10
                bg-gradient-to-l from-stone-50 to-transparent pointer-events-none" />

            <div
                className="flex py-2"
                style={{
                    animation: `marquee${reverse ? '-reverse' : ''} 40s linear infinite`,
                    width: 'max-content',
                }}>
                {doubled.map((t, i) => (
                    <MarqueeCard key={i} t={t} />
                ))}
            </div>
        </div>
    );
};

// ── Stats bar ─────────────────────────────────────────────────────────
const StatsBar = () => (
    <div className="flex items-center justify-center gap-8 md:gap-16 py-8 px-6
        bg-card rounded-2xl border border-border shadow-sm">
        {[
            { value: '1,200+', label: 'Học viên theo học' },
            { value: '4.9/5', label: 'Đánh giá trung bình' },
            { value: '92%', label: 'Đạt mục tiêu' },
            { value: '50+', label: 'Khoá học hoàn thành' },
        ].map((stat) => (
            <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground/70 mt-1 whitespace-nowrap">{stat.label}</p>
            </div>
        ))}
    </div>
);

// ── Main Section ──────────────────────────────────────────────────────
export const TestimonialsSection = () => {
    const [ref, isInView] = useInView();
    const featured = testimonials.find(t => t.featured) || testimonials[0];
    const flanking = testimonials.filter(t => !t.featured).slice(0, 4);
    const left = flanking.slice(0, 2);
    const right = flanking.slice(2, 4);
    // Two rows for marquee with different subsets
    const row1 = testimonials;
    const row2 = [...testimonials].reverse();

    return (
        <section id="testimonials" ref={ref} className="py-32 bg-muted overflow-hidden">

            {/* ── Part 1: Hero Spotlight ── */}
            <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
                {/* Header */}
                <div className={`text-center max-w-2xl mx-auto mb-16 transform transition-all duration-700
                    ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium
                        rounded-full uppercase tracking-wider mb-6">
                        Học viên nói gì
                    </span>
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                        Họ đã thành công
                        <br />
                        <span className="text-muted-foreground/70">cùng Skill Master</span>
                    </h2>
                </div>

                {/* Stats bar */}
                <div className={`mb-12 transform transition-all duration-700 delay-100
                    ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <StatsBar />
                </div>

                {/* Center hero layout */}
                <div className={`grid md:grid-cols-[1fr_1.65fr_1fr] gap-5 items-stretch
                    transform transition-all duration-700 delay-200
                    ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                    {/* Left compact cards */}
                    <div className="flex flex-col gap-5">
                        {left.map((t, i) => <CompactCard key={i} t={t} />)}
                    </div>

                    {/* Center featured */}
                    <FeaturedCard t={featured} />

                    {/* Right compact cards */}
                    <div className="flex flex-col gap-5">
                        {right.map((t, i) => <CompactCard key={i} t={t} />)}
                    </div>
                </div>
            </div>

            {/* ── Part 2: Infinite Marquee ── */}
            <div className={`mt-16 space-y-4 transform transition-all duration-700 delay-300
                ${isInView ? 'opacity-100' : 'opacity-0'}`}>
                <MarqueeRow items={row1} />
                <MarqueeRow items={row2} reverse />
            </div>

            {/* Marquee keyframes */}
            <style>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @keyframes marquee-reverse {
                    from { transform: translateX(-50%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </section>
    );
};

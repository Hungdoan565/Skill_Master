import React, { useEffect, useState } from 'react';
import { GraduationCap, Award, Users, BookOpen, ArrowRight } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { stats } from '../constants/landing-data';

/**
 * Animated Counter — tabular-nums, crisp easing
 */
const AnimatedCounter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (hasStarted) return;
        setHasStarted(true);
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(end * easeOut);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [hasStarted, end, duration]);

    return <>{Math.floor(count).toLocaleString()}</>;
};

/**
 * Stats Section — Swiss Grid + Bento Layout
 * Design: 12-col grid, border separations (no cards, no glows),
 * one accent (#FF4D00), typography hierarchy via weight/size.
 * Inspired by About page and Roadmap page header.
 */
export const StatsSection = () => {
    const [ref, isInView] = useInView();
    const { heroStat, supportingStats, proofTags } = stats;

    return (
        <section ref={ref} className="border-t border-border" aria-label="Thành tựu đào tạo">
            <div className="max-w-[1600px] mx-auto">

                {/* ── Grid: hero stat (col 1-7) + supporting stats (col 8-12) ── */}
                <div className="grid grid-cols-12">

                    {/* ── LEFT: Hero Stat (col 1-7) ── */}
                    <div className="lg:col-span-7 p-8 lg:p-12 border-r border-border">
                        <div
                            className={`transform transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            {/* Section label */}
                            <div className="flex items-center gap-3 mb-12">
                                <span className="w-8 h-px bg-muted-foreground/30" />
                                <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                                </span>
                            </div>

                            {/* Hero number — Swiss large */}
                            <div className="mb-8">
                                <div className="font-black tracking-tighter text-[80px] lg:text-[120px] leading-[0.85] text-foreground tabular-nums">
                                    {isInView && <AnimatedCounter end={heroStat.value} duration={2500} />}
                                    <span className="text-muted-foreground ml-1">{heroStat.suffix}</span>
                                </div>
                            </div>

                            {/* Label + Sublabel */}
                            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
                                {heroStat.label}
                            </h3>
                            <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-md">
                                {heroStat.sublabel}
                            </p>

                            {/* Source */}
                            <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-foreground text-sm font-medium">{heroStat.source}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{heroStat.sourceNote}</p>
                                </div>
                                <a
                                    href="#"
                                    className="flex items-center gap-2 text-xs font-semibold text-[#FF4D00] hover:text-orange-400 transition-colors group"
                                >
                                    Xem chi tiết
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Supporting Stats (col 8-12) ── */}
                    <div className="lg:col-span-5 flex flex-col">

                        {/* Row 1: Students */}
                        <div
                            className={`flex-1 p-8 lg:p-10 border-b border-border
                                transform transition-all duration-700 delay-100
                                ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <div className="flex items-start justify-between h-full">
                                <div>
                                    <p className="font-black text-5xl lg:text-6xl tracking-tighter text-foreground tabular-nums mb-2">
                                        {isInView && <AnimatedCounter end={supportingStats[0].value} duration={2000} />}
                                        <span className="text-muted-foreground ml-0.5">{supportingStats[0].suffix}</span>
                                    </p>
                                    <h4 className="text-foreground font-semibold text-lg mb-1">{supportingStats[0].label}</h4>
                                    <p className="text-muted-foreground text-sm">{supportingStats[0].sublabel}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-1">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Teachers */}
                        <div
                            className={`flex-1 p-8 lg:p-10 border-b border-border
                                transform transition-all duration-700 delay-200
                                ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <div className="flex items-start justify-between h-full">
                                <div>
                                    <p className="font-black text-5xl lg:text-6xl tracking-tighter text-foreground tabular-nums mb-2">
                                        {isInView && <AnimatedCounter end={supportingStats[1].value} duration={2000} />}
                                        <span className="text-muted-foreground ml-0.5">{supportingStats[1].suffix}</span>
                                    </p>
                                    <h4 className="text-foreground font-semibold text-lg mb-1">{supportingStats[1].label}</h4>
                                    <p className="text-muted-foreground text-sm">{supportingStats[1].sublabel}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-1">
                                    <Award className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Courses */}
                        <div
                            className={`flex-1 p-8 lg:p-10
                                transform transition-all duration-700 delay-300
                                ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <div className="flex items-start justify-between h-full">
                                <div>
                                    <p className="font-black text-5xl lg:text-6xl tracking-tighter text-foreground tabular-nums mb-2">
                                        {isInView && <AnimatedCounter end={supportingStats[2].value} duration={2000} />}
                                        <span className="text-muted-foreground ml-0.5">{supportingStats[2].suffix}</span>
                                    </p>
                                    <h4 className="text-foreground font-semibold text-lg mb-1">{supportingStats[2].label}</h4>
                                    <p className="text-muted-foreground text-sm">{supportingStats[2].sublabel}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-1">
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── BOTTOM: Proof Rail — credential strip ── */}
                <div
                    className={`border-t border-border px-8 lg:px-12 py-6 transform transition-all duration-700 delay-500 ${isInView ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                        <span className="text-muted-foreground text-xs uppercase tracking-widest font-medium shrink-0">
                            Được chứng nhận
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-px h-4 bg-border hidden lg:block" />
                            {proofTags.map((tag, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 text-muted-foreground"
                                >
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold">{tag.label}</span>
                                    <span className="text-muted-foreground text-xs">·</span>
                                    <span className="text-muted-foreground/80 text-xs">{tag.note}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

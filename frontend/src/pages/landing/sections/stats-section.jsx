import React, { useEffect, useState } from 'react';
import { Users, Target, Award, Calendar } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { stats } from '../constants/landing-data';

// Icon mapping
const iconMap = {
    0: Users,
    1: Target,
    2: Award,
    3: Calendar,
};

// Color gradients
const colorMap = {
    0: 'from-blue-500 to-cyan-500',
    1: 'from-green-500 to-emerald-500',
    2: 'from-purple-500 to-pink-500',
    3: 'from-orange-500 to-red-500',
};

/**
 * Animated Counter Component - Enhanced
 */
const AnimatedCounter = ({ end, suffix = '', duration = 2000, decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (hasStarted) return;

        setHasStarted(true);
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = end * easeOut;

            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [hasStarted, end, duration]);

    const displayValue = decimals > 0
        ? count.toFixed(decimals)
        : Math.floor(count).toLocaleString();

    return <>{displayValue}{suffix}</>;
};

/**
 * Stats Section Component - PRODUCTION READY
 * Displays real statistics with icons and animations
 */
export const StatsSection = () => {
    const [ref, isInView] = useInView();

    return (
        <section ref={ref} className="relative py-28 bg-zinc-900 overflow-hidden" aria-label="Statistics">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
                aria-hidden="true" />

            {/* Gradient Accents */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" aria-hidden="true" />

            <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Title */}
                <div className={`text-center mb-16 transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 bg-white/10 text-white/80 text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-4 backdrop-blur-sm">
                        Thành tựu đào tạo
                    </span>
                    <h2 className="font-display text-3xl lg:text-4xl font-bold text-white tracking-tight">
                        Con số ấn tượng của chúng tôi
                    </h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {stats.map((stat, index) => {
                        const Icon = iconMap[index];
                        const gradient = colorMap[index];

                        return (
                            <div
                                key={index}
                                className={`relative group p-8 rounded-3xl transition-all duration-500
                          ${stat.highlight
                                        ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-2xl shadow-red-600/30'
                                        : 'bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10'}
                          transform hover:scale-105 hover:-translate-y-2
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6
                              ${stat.highlight
                                        ? 'bg-white/20'
                                        : `bg-gradient-to-br ${gradient} shadow-lg`}`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Number */}
                                <p className={`font-display text-5xl lg:text-6xl font-bold tracking-tight
                            ${stat.highlight ? 'text-white' : 'text-white'}`}>
                                    {isInView && (
                                        <AnimatedCounter
                                            end={stat.value}
                                            suffix={stat.suffix}
                                            decimals={stat.suffix === '%' ? 1 : 0}
                                        />
                                    )}
                                </p>

                                {/* Labels */}
                                <p className={`mt-3 text-lg font-semibold
                            ${stat.highlight ? 'text-white' : 'text-stone-200'}`}>
                                    {stat.label}
                                </p>
                                <p className={`text-sm
                            ${stat.highlight ? 'text-white/70' : 'text-stone-400'}`}>
                                    {stat.sublabel}
                                </p>

                                {/* Highlight Badge */}
                                {stat.highlight && (
                                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-white text-red-600 
                               text-xs font-bold rounded-full shadow-lg">
                                        CAM KẾT
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Trust Note */}
                <p className={`text-center text-stone-400 mt-12 text-sm transform transition-all duration-700 delay-500
                    ${isInView ? 'opacity-100' : 'opacity-0'}`}>
                    * Số liệu cập nhật đến tháng 12/2024
                </p>
            </div>
        </section>
    );
};

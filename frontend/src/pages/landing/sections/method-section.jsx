import React, { useState, useEffect } from 'react';
import { useInView } from '../hooks/use-in-view';
import { methodSteps } from '../constants/landing-data';
import { ClipboardCheck, Rocket, BookOpen, Trophy } from 'lucide-react';
import logoImage from '@/assets/logo.png';

// Icon mapping for steps
const stepIcons = [ClipboardCheck, Rocket, BookOpen, Trophy];

/**
 * INTERACTIVE METHOD SECTION
 * Auto-rotating steps with click interaction
 */
export const MethodSection = () => {
    const [ref, isInView] = useInView();
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate logic
    useEffect(() => {
        if (!isInView || isPaused) return;

        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % methodSteps.length);
        }, 5000); // 5 seconds per step

        return () => clearInterval(timer);
    }, [isInView, isPaused]);

    return (
        <section id="method" ref={ref} className="py-32 bg-background">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left - Interactive Visual */}
                    <div className={`relative transform transition-all duration-1000 order-2 lg:order-1
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
                        <div className="relative aspect-square max-w-lg mx-auto">
                            {/* Background Circle */}
                            <div className="absolute inset-0 bg-muted rounded-full scale-90" aria-hidden="true" />

                            {/* Active Step Highlight Ring */}
                            <div
                                className="absolute inset-0 rounded-full border-2 border-red-100 transition-transform duration-700 ease-in-out"
                                style={{ transform: `rotate(${activeStep * 90}deg)` }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full shadow-lg shadow-red-500/50" />
                            </div>

                            {/* Center Content - Changes based on step */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-48 h-48 bg-card rounded-full flex items-center justify-center
                             shadow-2xl shadow-black/10 dark:shadow-black/30 z-10 overflow-hidden">
                                    {/* Animated Icon Transition */}
                                    {methodSteps.map((step, index) => {
                                        const Icon = stepIcons[index];
                                        const isActive = activeStep === index;
                                        return (
                                            <div
                                                key={index}
                                                className={`absolute inset-0 flex items-center justify-center transition-all duration-500
                                   ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                                            >
                                                <Icon className="w-20 h-20 text-red-600" strokeWidth={1.5} />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pulse Effect */}
                                <div className="absolute w-48 h-48 bg-red-500/5 rounded-full animate-ping" />
                            </div>

                            {/* Orbiting Step Numbers - Clickable */}
                            {methodSteps.map((step, index) => {
                                const angle = (index * 90 - 90) * (Math.PI / 180); // Start from top
                                const radius = 42; // percentage
                                const x = 50 + radius * Math.cos(angle);
                                const y = 50 + radius * Math.sin(angle);
                                const isActive = activeStep === index;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => { setActiveStep(index); setIsPaused(true); }}
                                        className={`absolute w-14 h-14 rounded-2xl flex items-center justify-center
                             transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300
                             ${isActive
                                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110 z-20'
                                                : 'bg-card text-muted-foreground/70 border border-border hover:border-red-200 hover:text-red-500 scale-100 z-10'}`}
                                        style={{ left: `${x}%`, top: `${y}%` }}
                                        aria-label={`Bước ${step.number}: ${step.title}`}
                                    >
                                        <span className="font-display text-lg font-bold">{step.number}</span>

                                        {/* Ripple effect when active */}
                                        {isActive && (
                                            <span className="absolute inset-0 rounded-2xl animate-ping bg-red-600/30" />
                                        )}
                                    </button>
                                );
                            })}

                            {/* Connecting Lines (Dashed) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden="true">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="#E7E5E4"
                                    strokeWidth="1"
                                    strokeDasharray="6 6"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Right - Interactive Content List */}
                    <div className="order-1 lg:order-2">
                        <span className="inline-block px-4 py-1.5 bg-red-600 text-white text-xs font-medium 
                          rounded-full uppercase tracking-wider mb-6">
                            Phương pháp học
                        </span>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                            4 bước đến thành công
                        </h2>
                        <p className="mt-6 text-lg text-muted-foreground leading-relaxed mb-10">
                            Quy trình học tập khoa học, được chứng minh hiệu quả qua hàng nghìn học viên.
                        </p>

                        {/* Clickable List */}
                        <div className="space-y-4">
                            {methodSteps.map((step, index) => {
                                const isActive = activeStep === index;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => { setActiveStep(index); setIsPaused(true); }}
                                        className={`relative pl-8 pr-6 py-6 rounded-2xl cursor-pointer transition-all duration-500
                              ${isActive
                                                ? 'bg-muted border border-border shadow-sm translate-x-4'
                                                : 'hover:bg-card hover:translate-x-2 border border-transparent'}`}
                                    >
                                        {/* Progress Bar (Vertical) used as connector visually? No, use left border */}
                                        <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-colors duration-300
                                  ${isActive ? 'bg-red-600' : 'bg-muted'}`} />

                                        <h3 className={`text-xl font-bold transition-colors duration-300 flex items-center gap-3
                                  ${isActive ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                                            <span className={`text-sm font-normal py-0.5 px-2 rounded-md ${isActive ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                                                Bước {step.number}
                                            </span>
                                            {step.title}
                                        </h3>

                                        <div
                                            className={`mt-2 overflow-hidden transition-all duration-500 ease-in-out
                                 ${isActive ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <p className="text-muted-foreground leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

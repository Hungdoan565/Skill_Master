import React, { useState, useEffect, useCallback } from 'react';
import { SmartImage } from '@/components/common';
import { Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { teachers } from '../constants/landing-data';

/**
 * Teacher Carousel Component
 * Auto-rotating carousel showing 4 teachers at a time with smooth transitions
 */
export const TeacherCarousel = () => {
    const [ref, isInView] = useInView();
    const [currentBatch, setCurrentBatch] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const batchSize = 4;
    const totalBatches = Math.ceil(teachers.length / batchSize);

    // Get current batch of teachers
    const getCurrentTeachers = useCallback(() => {
        const start = currentBatch * batchSize;
        return teachers.slice(start, start + batchSize);
    }, [currentBatch]);

    // Auto-rotate every 4 seconds
    useEffect(() => {
        if (!isInView || isPaused) return;

        const timer = setInterval(() => {
            setCurrentBatch((prev) => (prev + 1) % totalBatches);
        }, 4000);

        return () => clearInterval(timer);
    }, [isInView, isPaused, totalBatches]);

    const goToNext = () => {
        setCurrentBatch((prev) => (prev + 1) % totalBatches);
    };

    const goToPrev = () => {
        setCurrentBatch((prev) => (prev - 1 + totalBatches) % totalBatches);
    };

    const currentTeachers = getCurrentTeachers();

    return (
        <section id="teachers" ref={ref} className="py-32 bg-stone-50 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className={`text-center max-w-2xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
                        Đội ngũ giảng viên
                    </span>
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
                        Học từ những người
                        <br />
                        <span className="text-zinc-400">giỏi nhất trong ngành</span>
                    </h2>
                    <p className="mt-6 text-lg text-zinc-500">
                        100% giảng viên có chứng chỉ quốc tế và kinh nghiệm giảng dạy chuyên sâu.
                    </p>
                </div>

                {/* Carousel Container */}
                <div
                    className="relative mt-16"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Navigation Arrows */}
                    <button
                        onClick={goToPrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
                     w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200
                     flex items-center justify-center text-zinc-600 hover:text-zinc-900
                     hover:shadow-xl transition-all duration-300
                     opacity-0 group-hover:opacity-100 lg:opacity-100"
                        aria-label="Giảng viên trước"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
                     w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200
                     flex items-center justify-center text-zinc-600 hover:text-zinc-900
                     hover:shadow-xl transition-all duration-300
                     opacity-0 group-hover:opacity-100 lg:opacity-100"
                        aria-label="Giảng viên tiếp theo"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Teachers Grid with Animation */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 lg:px-8">
                        {currentTeachers.map((teacher, index) => (
                            <div
                                key={`${currentBatch}-${index}`}
                                className={`group p-6 bg-white rounded-3xl border border-stone-200
                         hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                         transition-all duration-500 text-center
                         transform animate-fade-slide-in`}
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                {/* Avatar with Real Photo */}
                                <div className="relative w-28 h-28 mx-auto">
                                    <SmartImage
                                        src={teacher.image}
                                        alt={teacher.name}
                                        className="w-full h-full rounded-full object-cover border-4 border-white
                             shadow-lg group-hover:scale-105 transition-transform duration-300"
                                        containerClassName="w-full h-full rounded-full"
                                        aspectRatio="aspect-square"
                                    />
                                    {/* Online indicator */}
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full
                               border-2 border-white"
                                        aria-label="Đang hoạt động" />
                                </div>

                                {/* Badge */}
                                <span className="inline-block mt-4 px-3 py-1 bg-red-50 text-red-700 
                              text-xs font-semibold rounded-full">
                                    {teacher.badge}
                                </span>

                                {/* Info */}
                                <h3 className="mt-4 font-semibold text-lg text-zinc-900">{teacher.name}</h3>
                                <p className="text-sm text-zinc-500">{teacher.role}</p>

                                {/* Rating & Students */}
                                <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-medium">{teacher.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-zinc-400">
                                        <Users className="w-4 h-4" />
                                        <span>{teacher.students}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-stone-100">
                                    <p className="text-xs text-zinc-400">{teacher.experience}</p>
                                    <p className="text-sm font-medium text-zinc-700 mt-1">{teacher.specialty}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalBatches }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentBatch(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300
                          ${currentBatch === index
                                        ? 'bg-red-600 w-8'
                                        : 'bg-stone-300 hover:bg-stone-400'}`}
                                aria-label={`Xem nhóm giảng viên ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Total Count */}
                <p className={`text-center text-zinc-500 mt-6 transform transition-all duration-700 delay-500
                    ${isInView ? 'opacity-100' : 'opacity-0'}`}>
                    {teachers.length} giảng viên chuyên môn cao
                </p>
            </div>

            {/* Animation Styles */}
            <style>{`
        @keyframes fade-slide-in {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        .animate-fade-slide-in {
          animation: fade-slide-in 0.5s ease-out;
        }
      `}</style>
        </section>
    );
};

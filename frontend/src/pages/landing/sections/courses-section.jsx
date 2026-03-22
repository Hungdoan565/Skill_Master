import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { CourseModal } from '../components/course-modal';
import { courses } from '../constants/landing-data';

/**
 * COURSES SECTION - Training Programs
 * Now with "Quick View" Modal
 */
export const CoursesSection = () => {
    const [ref, isInView] = useInView();
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Open modal
    const handleCourseClick = (course) => {
        setSelectedCourse(course);
    };

    return (
        <>
            <section id="courses" ref={ref} className="py-32 bg-muted">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    {/* Section Header */}
                    <div className={`max-w-2xl transform transition-all duration-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <span className="inline-block px-4 py-1.5 bg-foreground text-background text-xs font-medium 
                          rounded-full uppercase tracking-wider mb-6">
                            Chương trình đào tạo
                        </span>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                            Lộ trình học tập
                            <br />
                            <span className="text-muted-foreground/70">được thiết kế riêng</span>
                        </h2>
                        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                            Mỗi chương trình được xây dựng dựa trên phương pháp giảng dạy hiện đại,
                            kết hợp lý thuyết và thực hành để đảm bảo hiệu quả tối đa.
                        </p>
                    </div>

                    {/* Courses Grid */}
                    <div className="mt-16 grid md:grid-cols-2 gap-6">
                        {courses.map((course, index) => (
                            <div
                                key={index}
                                onClick={() => handleCourseClick(course)}
                                className={`group relative p-8 bg-card rounded-3xl border border-border
                         hover:border-border hover:shadow-xl hover:shadow-black/5 dark:shadow-black/20
                         transition-all duration-500 cursor-pointer
                         transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${200 + index * 100}ms` }}
                            >
                                {/* Category Badge */}
                                <span className={`inline-block px-3 py-1 ${course.bgColor} text-xs font-medium 
                              rounded-full mb-4`}>
                                    {course.category}
                                </span>

                                {/* Content */}
                                <h3 className="font-display text-2xl font-bold text-foreground 
                            group-hover:text-foreground/90 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="mt-3 text-muted-foreground leading-relaxed">
                                    {course.description}
                                </p>

                                {/* Features */}
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {course.features.map((feature, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-muted text-muted-foreground 
                                          text-sm rounded-lg">
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground/70">Thời lượng</p>
                                        <p className="font-semibold text-foreground">{course.duration}</p>
                                    </div>
                                    <button
                                        className={`flex items-center justify-center w-12 h-12 rounded-full
                               bg-gradient-to-br ${course.color} text-white
                               group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                                        aria-label={`Xem chi tiết khóa ${course.title}`}
                                    >
                                        <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                </div>

                                {/* Hover Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-0 
                             group-hover:opacity-[0.03] rounded-3xl transition-opacity duration-500`}
                                    aria-hidden="true" />

                                {/* Quick View Label on Hover */}
                                <div className="absolute top-8 right-8 px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded-lg
                             opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg">
                                    Xem nhanh
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View All CTA */}
                    <div className={`mt-12 text-center transform transition-all duration-700 delay-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground 
                       font-medium transition-colors group"
                        >
                            Xem tất cả khóa học
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick View Modal */}
            <CourseModal
                isOpen={!!selectedCourse}
                onClose={() => setSelectedCourse(null)}
                course={selectedCourse}
            />
        </>
    );
};

import React from 'react';
import { useInView } from '../hooks/use-in-view';
import { testimonials } from '../constants/landing-data';

export const TestimonialsSection = () => {
    const [ref, isInView] = useInView();

    return (
        <section id="testimonials" ref={ref} className="py-32 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className={`text-center max-w-2xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
                        Đánh giá từ học viên
                    </span>
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
                        Họ đã thành công
                        <br />
                        <span className="text-zinc-400">cùng Skill Master</span>
                    </h2>
                </div>

                {/* Testimonials Grid */}
                <div className="mt-16 grid md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className={`group p-8 bg-stone-50 rounded-3xl border border-stone-200
                       hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                       transition-all duration-500
                       transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{ transitionDelay: `${200 + index * 100}ms` }}
                        >
                            {/* Quote */}
                            <div className="relative">
                                <span className="absolute -top-4 -left-2 font-display text-6xl text-stone-300 
                              select-none" aria-hidden="true">"</span>
                                <p className="relative text-zinc-600 leading-relaxed">
                                    {testimonial.content}
                                </p>
                            </div>

                            {/* Result Badge */}
                            <div className="mt-6">
                                <span className="inline-block px-3 py-1.5 bg-green-100 text-green-700 
                              text-sm font-medium rounded-full">
                                    {testimonial.result}
                                </span>
                            </div>

                            {/* Author */}
                            <div className="mt-6 pt-6 border-t border-stone-200 flex items-center gap-4">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.author}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                    loading="lazy"
                                />
                                <div>
                                    <p className="font-semibold text-zinc-900">{testimonial.author}</p>
                                    <p className="text-sm text-zinc-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

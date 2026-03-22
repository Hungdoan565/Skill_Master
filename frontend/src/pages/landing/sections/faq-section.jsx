import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { faqs } from '../constants/landing-data';

/**
 * FAQ Section Component
 * Displays frequently asked questions in an accordion format
 */
export const FAQSection = () => {
    const [ref, isInView] = useInView();
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" ref={ref} className="py-32 bg-background">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className={`text-center max-w-2xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="inline-block px-4 py-1.5 bg-foreground text-background text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
                        Câu hỏi thường gặp
                    </span>
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                        Giải đáp thắc mắc
                        <br />
                        <span className="text-muted-foreground/70">của bạn</span>
                    </h2>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Những câu hỏi phổ biến nhất từ học viên. Không tìm thấy câu trả lời?
                        Hãy liên hệ với chúng tôi!
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="mt-16 max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className={`group border border-border rounded-2xl overflow-hidden
                         bg-card hover:border-border hover:shadow-lg hover:shadow-black/5 dark:shadow-black/20
                         transition-all duration-300
                         transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${200 + index * 50}ms` }}
                            >
                                {/* Question Button */}
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                           transition-colors"
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-answer-${index}`}
                                >
                                    <span className={`font-semibold text-lg transition-colors
                                ${isOpen ? 'text-red-600' : 'text-foreground group-hover:text-red-600'}`}>
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`flex-shrink-0 w-5 h-5 ml-4 transition-all duration-300
                              ${isOpen ? 'rotate-180 text-red-600' : 'text-muted-foreground/70 group-hover:text-red-600'}`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {/* Answer Panel */}
                                <div
                                    id={`faq-answer-${index}`}
                                    className={`overflow-hidden transition-all duration-300 ease-in-out
                           ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                    aria-hidden={!isOpen}
                                >
                                    <div className="px-6 pb-5 pt-2">
                                        <p className="text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Contact CTA */}
                <div className={`mt-12 text-center transform transition-all duration-700 delay-500
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <p className="text-muted-foreground mb-4">
                        Vẫn còn thắc mắc?
                    </p>
                    <a
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white
                     rounded-full font-medium hover:bg-red-700 transition-colors
                     shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30"
                    >
                        Liên hệ tư vấn ngay
                    </a>
                </div>
            </div>
        </section >
    );
};

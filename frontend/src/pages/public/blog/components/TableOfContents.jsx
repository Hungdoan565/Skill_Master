import React, { useState, useEffect, useRef } from 'react';
import { List, ChevronRight } from 'lucide-react';

// ============================================
// TABLE OF CONTENTS - STICKY SIDEBAR
// ============================================
// Extracts headings from content and provides scroll spy
// ============================================

export const TableOfContents = ({ headings = [], activeId }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!headings || headings.length === 0) return null;

    return (
        <nav
            className="hidden xl:block sticky top-24"
            aria-label="Mục lục bài viết"
        >
            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 
                max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar shadow-sm">
                {/* Header */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center justify-between w-full mb-4 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-500 
                            rounded-lg flex items-center justify-center">
                            <List className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            Mục lục
                        </span>
                    </div>
                    <ChevronRight
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-300
                            ${isCollapsed ? '' : 'rotate-90'}`}
                    />
                </button>

                {/* Links */}
                <div className={`space-y-1 transition-all duration-300 overflow-hidden
                    ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                    {headings.map((heading, index) => (
                        <a
                            key={index}
                            href={`#${heading.id}`}
                            className={`block py-2 px-3 text-sm rounded-lg transition-all duration-200
                                ${heading.level === 3 ? 'pl-6' : ''}
                                ${heading.level === 4 ? 'pl-9' : ''}
                                ${activeId === heading.id
                                    ? 'bg-red-50 text-red-600 font-medium border-l-2 border-red-600'
                                    : 'text-zinc-600 hover:bg-stone-100 hover:text-zinc-900'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }}
                        >
                            {heading.text}
                        </a>
                    ))}
                </div>

                {/* Progress indicator */}
                <div className="mt-4 pt-4 border-t border-stone-200">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Tiến độ đọc</span>
                        <span className="font-mono">{headings.length} mục</span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

// ============================================
// HOOK: Extract headings for TOC
// ============================================
export const useTableOfContents = (contentRef) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        if (!contentRef?.current) return;

        const updateHeadings = () => {
            if (!contentRef.current) return;
            const elements = contentRef.current.querySelectorAll('h2, h3, h4');
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

            const headingList = Array.from(elements).map((el, index) => {
                if (!el.id) {
                    el.id = `heading-${index}`;
                }

                // Calculate position relative to document scroll
                const rect = el.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const absoluteTop = rect.top + scrollTop;
                const position = totalHeight > 0 ? (absoluteTop / totalHeight) * 100 : 0;

                return {
                    id: el.id,
                    text: el.textContent || '',
                    level: parseInt(el.tagName.charAt(1)),
                    position: Math.min(100, Math.max(0, position))
                };
            });
            setHeadings(headingList);
        };

        // Initial update
        updateHeadings();

        // Update on resize
        window.addEventListener('resize', updateHeadings);

        // Scroll spy
        const elements = contentRef.current.querySelectorAll('h2, h3, h4');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-100px 0px -80% 0px',
                threshold: 0
            }
        );

        elements.forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateHeadings);
        };
    }, [contentRef]);

    return { headings, activeId };
};

export default TableOfContents;

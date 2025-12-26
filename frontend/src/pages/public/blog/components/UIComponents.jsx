import React from 'react';
import { ChevronUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useScrollVisibility } from '../hooks/useBlogHooks';

// ============================================
// BACK TO TOP BUTTON
// ============================================
export const BackToTopButton = () => {
    const isVisible = useScrollVisibility(500);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 z-50 p-4 bg-zinc-900 text-white 
                rounded-full shadow-lg shadow-zinc-900/25 
                hover:bg-red-600 transition-all duration-300
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
            aria-label="Về đầu trang"
        >
            <ChevronUp className="w-6 h-6" />
        </button>
    );
};

// ============================================
// READING PROGRESS BAR
// ============================================
export const ReadingProgressBar = ({ progress }) => {
    return (
        <div
            className="fixed top-0 left-0 right-0 h-1 bg-stone-200 z-[60]"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Tiến trình đọc"
        >
            <div
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

// ============================================
// PAGINATION COMPONENT
// ============================================
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <nav
            className="flex items-center justify-center gap-2 py-12"
            aria-label="Phân trang"
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-xl bg-stone-100 text-zinc-600 
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    hover:bg-stone-200 transition-colors"
                aria-label="Trang trước"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {pages.map((page, i) => (
                page === '...' ? (
                    <span key={i} className="px-3 py-2 text-zinc-400" aria-hidden="true">...</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        aria-label={`Trang ${page}`}
                        className={`min-w-[44px] py-3 font-medium rounded-xl transition-all duration-300
                            ${currentPage === page
                                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/25'
                                : 'bg-stone-100 text-zinc-600 hover:bg-stone-200'
                            }`}
                    >
                        {page}
                    </button>
                )
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl bg-stone-100 text-zinc-600 
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    hover:bg-stone-200 transition-colors"
                aria-label="Trang sau"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </nav>
    );
};

// ============================================
// EMPTY STATE
// ============================================
export const EmptyState = ({ searchTerm, activeFilter, onClear }) => (
    <div className="py-24 text-center" role="status">
        <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-stone-400" aria-hidden="true" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-3">Không tìm thấy bài viết</h3>
        <p className="text-zinc-500 max-w-md mx-auto mb-8">
            {searchTerm
                ? `Không có kết quả cho "${searchTerm}"`
                : `Chưa có bài viết trong danh mục này`
            }
        </p>
        <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white 
                font-semibold rounded-full hover:bg-zinc-800 transition-colors
                shadow-lg shadow-zinc-900/25"
        >
            Xóa bộ lọc
            <X className="w-5 h-5" aria-hidden="true" />
        </button>
    </div>
);

// ============================================
// BREADCRUMBS
// ============================================
export const Breadcrumbs = ({ items }) => {
    return (
        <nav
            className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4"
            aria-label="Breadcrumb"
        >
            <ol className="flex items-center gap-2 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
                {items.map((item, index) => (
                    <li
                        key={index}
                        className="flex items-center gap-2"
                        itemProp="itemListElement"
                        itemScope
                        itemType="https://schema.org/ListItem"
                    >
                        {index > 0 && (
                            <span className="text-stone-300" aria-hidden="true">/</span>
                        )}
                        {item.href ? (
                            <a
                                href={item.href}
                                className="text-zinc-500 hover:text-red-600 transition-colors"
                                itemProp="item"
                            >
                                <span itemProp="name">{item.label}</span>
                            </a>
                        ) : (
                            <span className="text-zinc-900 font-medium" itemProp="name">
                                {item.label}
                            </span>
                        )}
                        <meta itemProp="position" content={String(index + 1)} />
                    </li>
                ))}
            </ol>
        </nav>
    );
};

// ============================================
// SKIP TO CONTENT LINK (ACCESSIBILITY)
// ============================================
export const SkipToContent = () => (
    <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
            focus:z-[100] focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white 
            focus:rounded-lg focus:shadow-lg"
    >
        Bỏ qua đến nội dung chính
    </a>
);

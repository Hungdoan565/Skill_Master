import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Search, X, BookOpen, Map, FileText, Globe, HelpCircle,
    ChevronRight, TrendingUp, Clock, GraduationCap, Award,
    MessageCircle, Users, Layers, Target, BarChart3, ArrowRight,
    Sparkles, Zap, Calendar, Phone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ============================================
// SEARCHABLE DATA SOURCES
// ============================================

const SEARCH_COURSES = [
    { id: 'c1', title: 'IELTS Academic', desc: 'Luyện thi IELTS từ 5.0 - 8.0+', category: 'Tiếng Anh', icon: Globe, href: '/courses', tags: ['ielts', 'tiếng anh', 'du học', 'academic'] },
    { id: 'c2', title: 'TOEIC 4 kỹ năng', desc: 'Đạt 650+ với giáo trình ETS', category: 'Tiếng Anh', icon: Award, href: '/courses', tags: ['toeic', 'tiếng anh', 'việc làm', 'ets'] },
    { id: 'c3', title: 'Giao tiếp thực chiến', desc: 'Tự tin nói tiếng Anh trong 3 tháng', category: 'Tiếng Anh', icon: MessageCircle, href: '/courses', tags: ['giao tiếp', 'speaking', 'tiếng anh', 'nói'] },
    { id: 'c4', title: 'Tiếng Anh cho trẻ em', desc: 'Chương trình Cambridge Kids', category: 'Tiếng Anh', icon: Users, href: '/courses', tags: ['trẻ em', 'kids', 'cambridge', 'thiếu nhi'] },
    { id: 'c5', title: 'Tin học văn phòng', desc: 'Word, Excel, PowerPoint chuẩn MOS', category: 'Tin học', icon: FileText, href: '/courses', tags: ['tin học', 'word', 'excel', 'powerpoint', 'mos', 'văn phòng'] },
    { id: 'c6', title: 'IC3 Digital Literacy', desc: 'Chứng chỉ quốc tế về CNTT', category: 'Tin học', icon: Layers, href: '/courses', tags: ['ic3', 'cntt', 'chứng chỉ', 'digital'] },
    { id: 'c7', title: 'Excel nâng cao', desc: 'Pivot, VBA, Dashboard chuyên sâu', category: 'Tin học', icon: Target, href: '/courses', tags: ['excel', 'vba', 'pivot', 'dashboard', 'nâng cao'] },
    { id: 'c8', title: 'Phân tích dữ liệu', desc: 'Power BI, SQL cơ bản', category: 'Tin học', icon: BarChart3, href: '/courses', tags: ['data', 'power bi', 'sql', 'phân tích', 'dữ liệu'] },
];

const SEARCH_ROADMAPS = [
    { id: 'r1', title: 'Du học & Định cư', desc: 'IELTS 6.5+ trong 6 tháng', icon: GraduationCap, href: '/roadmap/study-abroad', tags: ['du học', 'định cư', 'ielts', 'visa'] },
    { id: 'r2', title: 'Việc làm & Thăng tiến', desc: 'TOEIC + Tin học văn phòng', icon: Target, href: '/roadmap/career', tags: ['việc làm', 'thăng tiến', 'toeic', 'cv', 'career'] },
    { id: 'r3', title: 'Mất gốc tiếng Anh', desc: 'Lấy lại căn bản sau 2 tháng', icon: Zap, href: '/roadmap/basic', tags: ['mất gốc', 'cơ bản', 'beginner', 'căn bản'] },
];

const SEARCH_PAGES = [
    { id: 'p1', title: 'Trang chủ', desc: 'Về Skill Master Education', icon: Globe, href: '/', tags: ['home', 'trang chủ'] },
    { id: 'p2', title: 'Về chúng tôi', desc: 'Câu chuyện, đội ngũ, cơ sở vật chất', icon: Users, href: '/about', tags: ['about', 'giới thiệu', 'đội ngũ', 'giảng viên'] },
    { id: 'p3', title: 'Liên hệ', desc: 'Hotline, email, địa chỉ các cơ sở', icon: Phone, href: '/contact', tags: ['liên hệ', 'contact', 'hotline', 'địa chỉ'] },
    { id: 'p4', title: 'Blog & Tài nguyên', desc: 'Bài viết, tips học tập', icon: FileText, href: '/blog', tags: ['blog', 'bài viết', 'tips', 'tài nguyên'] },
    { id: 'p5', title: 'Đánh giá trình độ', desc: 'Test năng lực miễn phí online', icon: Target, href: '/assessment', tags: ['test', 'đánh giá', 'trình độ', 'assessment'] },
    { id: 'p6', title: 'Đăng nhập', desc: 'Truy cập tài khoản của bạn', icon: ArrowRight, href: '/login', tags: ['login', 'đăng nhập', 'tài khoản'] },
    { id: 'p7', title: 'Đăng ký', desc: 'Tạo tài khoản mới', icon: Sparkles, href: '/register', tags: ['register', 'đăng ký', 'tạo tài khoản'] },
];

const SEARCH_FAQ = [
    { id: 'f1', title: 'Đăng ký học thử miễn phí', desc: 'Qua form, hotline hoặc đến trực tiếp cơ sở', icon: Calendar, href: '/contact', tags: ['học thử', 'miễn phí', 'đăng ký'] },
    { id: 'f2', title: 'Học phí các khóa học', desc: 'Từ 3-8 triệu/khóa, hỗ trợ trả góp 0%', icon: FileText, href: '/contact#faq', tags: ['học phí', 'giá', 'chi phí', 'trả góp'] },
    { id: 'f3', title: 'Cam kết đầu ra', desc: 'Cam kết bằng văn bản, học lại miễn phí nếu không đạt', icon: Award, href: '/contact#faq', tags: ['cam kết', 'đầu ra', 'bảo đảm', 'chất lượng'] },
    { id: 'f4', title: 'Lịch học linh hoạt', desc: 'Nhiều ca: sáng, chiều, tối — có thể đổi ca', icon: Clock, href: '/contact#faq', tags: ['lịch học', 'ca học', 'giờ học', 'linh hoạt'] },
    { id: 'f5', title: 'Bảo lưu khóa học', desc: 'Tối đa 2 lần, mỗi lần 30 ngày', icon: HelpCircle, href: '/contact#faq', tags: ['bảo lưu', 'tạm dừng', 'nghỉ'] },
];

// ============================================
// CATEGORY CONFIG
// ============================================
const CATEGORIES = {
    courses: { label: 'Khóa học', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    roadmaps: { label: 'Lộ trình', icon: Map, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    pages: { label: 'Trang', icon: Globe, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    faq: { label: 'Hỏi đáp', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    blog: { label: 'Bài viết', icon: FileText, color: 'text-red-600 bg-red-50 border-red-100' },
};

// ============================================
// QUICK LINKS (when search is empty)
// ============================================
const QUICK_LINKS = [
    { label: 'Khóa học', href: '/courses', icon: BookOpen },
    { label: 'Lộ trình', href: '/roadmap', icon: Map },
    { label: 'Về chúng tôi', href: '/about', icon: Users },
    { label: 'Blog', href: '/blog', icon: FileText },
    { label: 'Test trình độ', href: '/assessment', icon: Target },
    { label: 'Liên hệ', href: '/contact', icon: Phone },
];

const TRENDING_TAGS = ['IELTS', 'TOEIC', 'Excel', 'Du học', 'Giao tiếp', 'Học phí'];

// ============================================
// SEARCH LOGIC
// ============================================
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

const searchItems = (items, query, category) => {
    const normalizedQuery = normalizeText(query);
    return items
        .filter(item => {
            const titleMatch = normalizeText(item.title).includes(normalizedQuery);
            const descMatch = normalizeText(item.desc).includes(normalizedQuery);
            const tagMatch = item.tags?.some(tag => normalizeText(tag).includes(normalizedQuery));
            const categoryMatch = item.category ? normalizeText(item.category).includes(normalizedQuery) : false;
            return titleMatch || descMatch || tagMatch || categoryMatch;
        })
        .map(item => ({ ...item, _category: category }));
};

// ============================================
// UNIVERSAL SEARCH OVERLAY
// ============================================
export const UniversalSearchOverlay = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const navigate = useNavigate();

    // Auto-focus + body scroll lock
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Search results
    const results = useMemo(() => {
        if (!query.trim()) return [];

        const courseResults = searchItems(SEARCH_COURSES, query, 'courses');
        const roadmapResults = searchItems(SEARCH_ROADMAPS, query, 'roadmaps');
        const pageResults = searchItems(SEARCH_PAGES, query, 'pages');
        const faqResults = searchItems(SEARCH_FAQ, query, 'faq');

        // Combine and limit
        const all = [...courseResults, ...roadmapResults, ...pageResults, ...faqResults];
        return all.slice(0, 8);
    }, [query]);

    // Reset selection when results change
    useEffect(() => setSelectedIndex(0), [results]);

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            navigate(results[selectedIndex].href);
            onClose();
        }
    };

    // Scroll selected into view
    useEffect(() => {
        if (resultsRef.current) {
            const selected = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            selected?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Group results by category
    const groupedResults = useMemo(() => {
        const groups = {};
        results.forEach(item => {
            if (!groups[item._category]) groups[item._category] = [];
            groups[item._category].push(item);
        });
        return groups;
    }, [results]);

    // Flat index for keyboard nav
    let flatIndex = 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-zinc-900/20 overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-200/50">
                {/* Search Input */}
                <div className="relative flex items-center border-b border-stone-100">
                    <Search className="absolute left-5 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm khóa học, lộ trình, bài viết..."
                        className="w-full pl-13 pr-24 py-4 text-base bg-transparent border-none focus:ring-0 focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                        style={{ paddingLeft: '3.25rem' }}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="absolute right-4 flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex text-[10px] font-semibold text-zinc-400 px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50">
                            ESC
                        </kbd>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div ref={resultsRef} className="max-h-[55vh] overflow-y-auto">
                    {!query.trim() ? (
                        /* Empty state: Quick Links + Trending */
                        <div className="p-5">
                            {/* Quick Links Grid */}
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                                Truy cập nhanh
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
                                {QUICK_LINKS.map(link => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        onClick={onClose}
                                        className="group flex flex-col items-center gap-1.5 p-3 rounded-xl 
                                            hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-red-50 
                                            flex items-center justify-center transition-colors">
                                            <link.icon className="w-5 h-5 text-zinc-500 group-hover:text-red-600 transition-colors" />
                                        </div>
                                        <span className="text-[11px] font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors text-center">
                                            {link.label}
                                        </span>
                                    </Link>
                                ))}
                            </div>

                            {/* Trending Tags */}
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                                <TrendingUp className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                                Tìm kiếm phổ biến
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {TRENDING_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setQuery(tag)}
                                        className="px-3 py-1.5 bg-stone-50 border border-stone-200 text-zinc-600 
                                            text-sm font-medium rounded-full hover:bg-red-50 hover:border-red-200 
                                            hover:text-red-600 transition-all"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : Object.keys(groupedResults).length > 0 ? (
                        /* Results grouped by category */
                        <div className="py-2">
                            {Object.entries(groupedResults).map(([catKey, items]) => {
                                const cat = CATEGORIES[catKey];
                                if (!cat) return null;

                                return (
                                    <div key={catKey}>
                                        {/* Category Header */}
                                        <div className="flex items-center gap-2 px-5 py-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                                                text-[10px] font-bold uppercase tracking-widest border ${cat.color}`}>
                                                <cat.icon className="w-3 h-3" />
                                                {cat.label}
                                            </span>
                                            <div className="flex-1 h-px bg-stone-100" />
                                        </div>

                                        {/* Items */}
                                        {items.map(item => {
                                            const currentFlat = flatIndex++;
                                            const isSelected = currentFlat === selectedIndex;
                                            const ItemIcon = item.icon;

                                            return (
                                                <Link
                                                    key={item.id}
                                                    to={item.href}
                                                    onClick={onClose}
                                                    data-index={currentFlat}
                                                    onMouseEnter={() => setSelectedIndex(currentFlat)}
                                                    className={`group flex items-center gap-4 px-5 py-3 transition-colors
                                                        ${isSelected ? 'bg-stone-50' : 'hover:bg-stone-50'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                                        transition-colors ${isSelected
                                                            ? 'bg-red-50 text-red-600'
                                                            : 'bg-stone-100 text-zinc-500 group-hover:bg-red-50 group-hover:text-red-600'}`}>
                                                        <ItemIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-semibold leading-tight transition-colors
                                                            ${isSelected ? 'text-red-600' : 'text-zinc-900 group-hover:text-red-600'}`}>
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 shrink-0 transition-all
                                                        ${isSelected
                                                            ? 'text-zinc-400 translate-x-0 opacity-100'
                                                            : 'text-zinc-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}
                                                    />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* No results */
                        <div className="py-16 text-center">
                            <Search className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                            <p className="text-zinc-500 font-medium">
                                Không tìm thấy kết quả cho "<span className="text-zinc-900 font-semibold">{query}</span>"
                            </p>
                            <p className="text-sm text-zinc-400 mt-2">
                                Thử tìm: khóa học, IELTS, TOEIC, Excel, lộ trình, học phí...
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium">
                        <span className="hidden sm:flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded border border-stone-200 bg-white text-[9px]">↑</kbd>
                            <kbd className="px-1 py-0.5 rounded border border-stone-200 bg-white text-[9px]">↓</kbd>
                            di chuyển
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded border border-stone-200 bg-white text-[9px]">↵</kbd>
                            mở
                        </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium">
                        {results.length > 0 ? `${results.length} kết quả` : 'Skill Master Search'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UniversalSearchOverlay;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SmartImage } from '@/components/common';
import { Star, Users, X, Award, Clock, BookOpen, ChevronLeft, ChevronRight, Quote, Sparkles } from 'lucide-react';
import { useInView } from '../hooks/use-in-view';
import { teachers } from '../constants/landing-data';

/**
 * Teacher Showcase — Spotlight Cards + Cinematic Profile Modal
 * 
 * Carousel: 4-per-batch with arrows, auto-rotate, mouse-tracking spotlight effect
 * Profile: Option A — Cinematic dark backdrop, large portrait, glassmorphism stats
 */

const teacherQuotes = {
    'Ms. Ngọc Anh': 'Viết tốt không phải bẩm sinh — đó là kỹ năng ai cũng có thể rèn luyện được.',
    'Mr. Hoàng Nam': 'TOEIC không khó, chỉ cần đúng phương pháp và luyện tập đều đặn.',
    'Ms. Thùy Linh': 'Excel là siêu năng lực trong công việc hiện đại — ai cũng nên biết.',
    'Mr. Minh Đức': 'Giao tiếp tiếng Anh tự tin bắt đầu từ việc không sợ sai.',
    'Ms. Lan Phương': 'TOEFL đòi hỏi tư duy academic — tôi giúp bạn xây nền tảng vững chắc.',
    'Mr. Quốc Việt': 'Công nghệ thay đổi mỗi ngày, nhưng tư duy số là nền tảng không thay đổi.',
    'Ms. Hồng Nhung': 'Trẻ em học tốt nhất khi được vui chơi — tôi biến mỗi buổi học thành trò chơi.',
    'Mr. Thanh Tùng': 'Pronunciation là chiếc chìa khóa mở cánh cửa tự tin khi giao tiếp.',
};

const accentColors = [
    { bg: 'from-red-600 to-rose-500', badge: 'bg-red-50 text-red-700', glow: 'rgba(239,68,68,0.15)', glass: 'rgba(239,68,68,0.25)' },
    { bg: 'from-blue-600 to-indigo-500', badge: 'bg-blue-50 text-blue-700', glow: 'rgba(59,130,246,0.15)', glass: 'rgba(59,130,246,0.25)' },
    { bg: 'from-emerald-600 to-teal-500', badge: 'bg-emerald-50 text-emerald-700', glow: 'rgba(16,185,129,0.15)', glass: 'rgba(16,185,129,0.25)' },
    { bg: 'from-amber-600 to-orange-500', badge: 'bg-amber-50 text-amber-700', glow: 'rgba(245,158,11,0.15)', glass: 'rgba(245,158,11,0.25)' },
    { bg: 'from-purple-600 to-violet-500', badge: 'bg-purple-50 text-purple-700', glow: 'rgba(139,92,246,0.15)', glass: 'rgba(139,92,246,0.25)' },
    { bg: 'from-cyan-600 to-sky-500', badge: 'bg-cyan-50 text-cyan-700', glow: 'rgba(6,182,212,0.15)', glass: 'rgba(6,182,212,0.25)' },
    { bg: 'from-pink-600 to-rose-500', badge: 'bg-pink-50 text-pink-700', glow: 'rgba(236,72,153,0.15)', glass: 'rgba(236,72,153,0.25)' },
    { bg: 'from-indigo-600 to-blue-500', badge: 'bg-indigo-50 text-indigo-700', glow: 'rgba(99,102,241,0.15)', glass: 'rgba(99,102,241,0.25)' },
];

// ─── Spotlight Card (mouse-tracking glow + 3D tilt) ─────────────────
const SpotlightCard = ({ children, accent, onClick, className = '', style = {} }) => {
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const tiltX = isHovered && cardRef.current
        ? ((mousePos.y / cardRef.current.offsetHeight) - 0.5) * -8 : 0;
    const tiltY = isHovered && cardRef.current
        ? ((mousePos.x / cardRef.current.offsetWidth) - 0.5) * 8 : 0;

    return (
        <div ref={cardRef} onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
            className={`relative overflow-hidden cursor-pointer ${className}`}
            style={{
                ...style,
                transform: isHovered
                    ? `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px) scale(1.02)`
                    : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)',
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                boxShadow: isHovered
                    ? `0 20px 40px -10px rgba(0,0,0,0.15), 0 0 80px -20px ${accent.glow}`
                    : '0 1px 3px rgba(0,0,0,0.05)',
            }}>
            <div className="pointer-events-none absolute -inset-px rounded-3xl z-0 transition-opacity duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${accent.glow}, transparent 40%)`,
                }} />
            <div className="pointer-events-none absolute -inset-px rounded-3xl z-0 transition-opacity duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${accent.glow.replace('0.15', '0.4')}, transparent 40%)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: '1.5px',
                }} />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

// ─── Cinematic Profile Modal (Option A) ─────────────────────────────
const CinematicProfileModal = ({ teacher, teacherIndex, isOpen, onClose, onNext, onPrev }) => {
    const accent = accentColors[teacherIndex % accentColors.length];
    const quote = teacherQuotes[teacher?.name] || '';

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen, onClose, onNext, onPrev]);

    if (!isOpen || !teacher) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog" aria-modal="true">
            {/* Dark cinematic backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-cine-fade"
                onClick={onClose} />

            {/* Ambient glow orbs */}
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 bg-gradient-to-br ${accent.bg} animate-cine-glow`} />
            <div className={`absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-gradient-to-br ${accent.bg} animate-cine-glow-delay`} />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl max-h-[92vh] animate-cine-card z-10">

                {/* Close */}
                <button onClick={onClose}
                    className="absolute -top-3 -right-3 z-30 w-10 h-10 bg-white/10 hover:bg-white/20 
                        backdrop-blur-xl rounded-full flex items-center justify-center 
                        text-white/80 hover:text-white transition-all border border-white/10
                        hover:scale-110"
                    aria-label="Đóng">
                    <X className="w-5 h-5" />
                </button>

                {/* Main Grid */}
                <div className="grid md:grid-cols-5 gap-0 rounded-3xl overflow-hidden 
                    border border-white/10 shadow-2xl shadow-black/50">

                    {/* ── Left: Cinematic Portrait (2/5) ── */}
                    <div className="relative md:col-span-2 min-h-[300px] md:min-h-[600px] overflow-hidden">
                        {/* Full bleed photo */}
                        <SmartImage src={teacher.image} alt={teacher.name}
                            className="w-full h-full object-cover object-top"
                            containerClassName="absolute inset-0 w-full h-full" />

                        {/* Gradient overlays for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${accent.bg} opacity-20 mix-blend-overlay`} />

                        {/* Bottom info on photo */}
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                            {/* Badge pill */}
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 
                                    bg-white/15 backdrop-blur-xl border border-white/20
                                    text-white text-xs font-bold rounded-full tracking-wider uppercase">
                                    <Sparkles className="w-3 h-3" />
                                    {teacher.badge}
                                </span>
                            </div>

                            {/* Name */}
                            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                                {teacher.name}
                            </h3>
                            <p className="text-white/60 text-base mt-2 font-medium">
                                {teacher.role}
                            </p>

                            {/* Quick stats row — glassmorphism pills */}
                            <div className="flex flex-wrap gap-2 mt-5">
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                    bg-white/10 backdrop-blur-xl border border-white/10">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="text-white text-sm font-bold">{teacher.rating}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                    bg-white/10 backdrop-blur-xl border border-white/10">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-white text-sm font-bold">{teacher.students}</span>
                                    <span className="text-white/50 text-xs">học viên</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                    bg-white/10 backdrop-blur-xl border border-white/10">
                                    <Clock className="w-4 h-4 text-green-400" />
                                    <span className="text-white text-sm font-bold">
                                        {teacher.experience.replace(' kinh nghiệm', '')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Profile Details (3/5) ── */}
                    <div className="md:col-span-3 bg-white p-8 md:p-10 
                        overflow-y-auto max-h-[60vh] md:max-h-[92vh] space-y-8">

                        {/* Section: Chuyên môn */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4
                                flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Chuyên môn giảng dạy
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {teacher.specialty.split(' & ').map((s, i) => (
                                    <span key={i} className="px-4 py-2 rounded-xl text-sm font-medium
                                        bg-stone-50 border border-stone-200 text-zinc-700
                                        hover:bg-stone-100 transition-colors">
                                        {s.trim()}
                                    </span>
                                ))}
                                <span className="px-4 py-2 rounded-xl text-sm font-medium
                                    bg-stone-50 border border-stone-200 text-zinc-700">
                                    {teacher.role}
                                </span>
                            </div>
                        </div>

                        {/* Section: Chứng chỉ & Bằng cấp */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4
                                flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Chứng chỉ quốc tế & Bằng cấp
                            </h4>
                            <div className="space-y-3">
                                {(teacher.certifications || []).map((cert, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl
                                        bg-stone-50 border border-stone-100 hover:bg-stone-100 
                                        transition-colors group">
                                        {/* Cert logo tile */}
                                        <div
                                            className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center 
                                                justify-center shadow-sm gap-0.5"
                                            style={{ backgroundColor: cert.color }}>
                                            <span className={`text-xs font-black tracking-tight leading-none
                                                ${cert.textDark ? 'text-gray-900' : 'text-white'}`}>
                                                {cert.abbr}
                                            </span>
                                            <span className={`text-[9px] font-semibold leading-none opacity-80
                                                ${cert.textDark ? 'text-gray-800' : 'text-white'}`}>
                                                {cert.year}
                                            </span>
                                        </div>

                                        {/* Cert info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-zinc-900 font-semibold text-sm leading-tight">
                                                        {cert.name}
                                                    </p>
                                                    <p className="text-zinc-500 text-xs mt-0.5">{cert.issuer}</p>
                                                </div>
                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold
                                                    bg-zinc-100 text-zinc-600 whitespace-nowrap">
                                                    {cert.category}
                                                </span>
                                            </div>
                                            {/* Score bar */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="h-1.5 flex-1 bg-stone-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{ backgroundColor: cert.color, width: '100%' }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-zinc-700 whitespace-nowrap">
                                                    {cert.score}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Quote */}
                        {quote && (
                            <div className="relative">
                                <div className={`absolute -left-2 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b ${accent.bg}`} />
                                <div className="pl-6 py-4">
                                    <Quote className="w-8 h-8 text-stone-200 mb-3" />
                                    <p className="text-zinc-700 text-lg italic leading-relaxed">
                                        "{quote}"
                                    </p>
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 shadow-sm">
                                            <SmartImage src={teacher.image} alt={teacher.name}
                                                className="w-full h-full object-cover"
                                                containerClassName="w-full h-full" aspectRatio="aspect-square" />
                                        </div>
                                        <span className="text-zinc-500 text-sm font-medium">— {teacher.name}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <button onClick={onPrev}
                    className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 p-3
                        bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full
                        text-white/60 hover:text-white border border-white/10
                        transition-all hover:scale-110 z-20"
                    aria-label="Trước">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={onNext}
                    className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 p-3
                        bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full
                        text-white/60 hover:text-white border border-white/10
                        transition-all hover:scale-110 z-20"
                    aria-label="Sau">
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Teacher dots navigation */}
                <div className="flex justify-center gap-1.5 mt-6">
                    {teachers.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300
                            ${i === teacherIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
                    ))}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes cine-fade { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cine-card { 
                    from { opacity: 0; transform: scale(0.92) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes cine-glow {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.1); opacity: 0.3; }
                }
                @keyframes cine-glow-delay {
                    0%, 100% { transform: scale(1); opacity: 0.15; }
                    50% { transform: scale(1.15); opacity: 0.25; }
                }
                .animate-cine-fade { animation: cine-fade 0.3s ease-out; }
                .animate-cine-card { animation: cine-card 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .animate-cine-glow { animation: cine-glow 4s ease-in-out infinite; }
                .animate-cine-glow-delay { animation: cine-glow-delay 5s ease-in-out infinite 1s; }
            `}</style>
        </div>
    );
};

// ─── Main Section ────────────────────────────────────────────────────
export const TeacherCarousel = () => {
    const [ref, isInView] = useInView();
    const [currentBatch, setCurrentBatch] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const batchSize = 4;
    const totalBatches = Math.ceil(teachers.length / batchSize);

    const getCurrentTeachers = useCallback(() => {
        const start = currentBatch * batchSize;
        return teachers.slice(start, start + batchSize);
    }, [currentBatch]);

    useEffect(() => {
        if (!isInView || isPaused) return;
        const timer = setInterval(() => {
            setCurrentBatch((prev) => (prev + 1) % totalBatches);
        }, 5000);
        return () => clearInterval(timer);
    }, [isInView, isPaused, totalBatches]);

    const goToNext = () => setCurrentBatch((prev) => (prev + 1) % totalBatches);
    const goToPrev = () => setCurrentBatch((prev) => (prev - 1 + totalBatches) % totalBatches);

    const openProfile = useCallback((teacher, globalIndex) => {
        setSelectedTeacher(teacher);
        setSelectedIndex(globalIndex);
        setIsPaused(true);
    }, []);

    const closeProfile = useCallback(() => {
        setSelectedTeacher(null);
        setSelectedIndex(-1);
        setIsPaused(false);
    }, []);

    const nextProfile = useCallback(() => {
        const next = (selectedIndex + 1) % teachers.length;
        setSelectedTeacher(teachers[next]);
        setSelectedIndex(next);
    }, [selectedIndex]);

    const prevProfile = useCallback(() => {
        const prev = (selectedIndex - 1 + teachers.length) % teachers.length;
        setSelectedTeacher(teachers[prev]);
        setSelectedIndex(prev);
    }, [selectedIndex]);

    const currentTeachers = getCurrentTeachers();

    return (
        <section id="teachers" ref={ref} className="py-32 bg-stone-50 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Header */}
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
                <div className="relative mt-16 px-4 lg:px-16"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}>

                    {/* Arrows — pushed out far from cards */}
                    <button onClick={goToPrev}
                        className="absolute left-0 lg:left-2 top-1/2 -translate-y-1/2 z-20
                            w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200
                            flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-stone-50
                            hover:shadow-xl hover:scale-110 transition-all duration-300"
                        aria-label="Trước">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={goToNext}
                        className="absolute right-0 lg:right-2 top-1/2 -translate-y-1/2 z-20
                            w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200
                            flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-stone-50
                            hover:shadow-xl hover:scale-110 transition-all duration-300"
                        aria-label="Sau">
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Cards Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 px-1 lg:px-2">
                        {currentTeachers.map((teacher, localIndex) => {
                            const globalIndex = currentBatch * batchSize + localIndex;
                            const accent = accentColors[globalIndex % accentColors.length];

                            return (
                                <SpotlightCard
                                    key={`${currentBatch}-${localIndex}`}
                                    accent={accent}
                                    onClick={() => openProfile(teacher, globalIndex)}
                                    className="bg-white rounded-3xl border border-stone-200 animate-fade-slide-in"
                                    style={{
                                        animationDelay: `${localIndex * 100}ms`,
                                        animationFillMode: 'backwards',
                                    }}>
                                    <div className="p-6 text-center">
                                        {/* Photo */}
                                        <div className="relative w-28 h-28 mx-auto">
                                            <SmartImage src={teacher.image} alt={teacher.name}
                                                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                                                containerClassName="w-full h-full rounded-full"
                                                aspectRatio="aspect-square" />
                                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                                                opacity-0 hover:opacity-100 transition-opacity duration-300">
                                                <span className="text-white text-[10px] font-bold tracking-wider uppercase px-2 py-1 
                                                    bg-white/20 rounded-full backdrop-blur-sm">
                                                    Xem hồ sơ
                                                </span>
                                            </div>
                                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full 
                                                border-2 border-white" aria-hidden="true" />
                                        </div>

                                        {/* Badge */}
                                        <span className={`inline-block mt-4 px-3 py-1 text-xs font-semibold rounded-full ${accent.badge}`}>
                                            {teacher.badge}
                                        </span>

                                        {/* Name */}
                                        <h3 className="mt-3 font-semibold text-lg text-zinc-900">{teacher.name}</h3>
                                        <p className="text-sm text-zinc-500">{teacher.role}</p>

                                        {/* Stats */}
                                        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span className="font-semibold">{teacher.rating}</span>
                                            </div>
                                            <div className="w-px h-4 bg-stone-200" />
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Users className="w-4 h-4" />
                                                <span>{teacher.students}</span>
                                            </div>
                                        </div>

                                        {/* Specialty */}
                                        <div className="mt-4 pt-4 border-t border-stone-100">
                                            <p className="text-xs text-zinc-400">{teacher.experience}</p>
                                            <p className="text-sm font-medium text-zinc-700 mt-1">{teacher.specialty}</p>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            );
                        })}
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalBatches }).map((_, index) => (
                            <button key={index} onClick={() => setCurrentBatch(index)}
                                className={`h-3 rounded-full transition-all duration-300
                                    ${currentBatch === index ? 'bg-red-600 w-8' : 'bg-stone-300 hover:bg-stone-400 w-3'}`}
                                aria-label={`Nhóm ${index + 1}`} />
                        ))}
                    </div>
                </div>

                <p className={`text-center text-zinc-500 mt-6 transform transition-all duration-700 delay-500
                    ${isInView ? 'opacity-100' : 'opacity-0'}`}>
                    {teachers.length} giảng viên chuyên môn cao
                </p>
            </div>

            {/* Cinematic Profile Modal */}
            <CinematicProfileModal
                teacher={selectedTeacher}
                teacherIndex={selectedIndex}
                isOpen={selectedTeacher !== null}
                onClose={closeProfile}
                onNext={nextProfile}
                onPrev={prevProfile}
            />

            <style>{`
                @keyframes fade-slide-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-slide-in { animation: fade-slide-in 0.5s ease-out; }
            `}</style>
        </section>
    );
};

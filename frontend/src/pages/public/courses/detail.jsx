import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/pages/landing/components/footer';
import { supabase } from '@/lib/supabaseClient';
import {
    ArrowRight,
    CheckCircle,
    MapPin,
    Clock,
    Calendar,
    Users,
    Target,
    ShieldCheck,
    PlayCircle,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Plus,
    Minus,
    Hash,
    Zap,
    Code,
    Trophy,
    Globe,
    FileText,
    Lock,
    Phone,
    CreditCard,
    Headphones,
    Mic,
    BookOpen,
    PenTool
} from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';

// ============================================
// MULTI-THEMATIC UI ENGINE
// ============================================

// Categories that use "Tech Minimalist" theme
const TECH_CATEGORIES = ['programming', 'it', 'office'];
// Categories that use "Academic Excellence" theme
const ACADEMIC_CATEGORIES = ['ielts', 'toeic', 'english', 'communication'];

/**
 * Extracts certificate/test information from course data
 * @param {object} course - The course object
 * @returns {object} { type: string, score: string, unit: string }
 */
const extractCourseCertInfo = (course) => {
    const title = (course?.title || '').toUpperCase();
    const desc = (course?.description || '').toUpperCase();
    const cat = (course?.category || '').toLowerCase();

    // Default fallbacks
    let type = 'IELTS';
    let score = '7.0+';
    let unit = 'BAND';

    if (cat === 'toeic' || title.includes('TOEIC')) {
        type = 'TOEIC';
        unit = 'SCORE';
        const match = title.match(/(\d{3}\+?)/) || desc.match(/(\d{3}\+?)/);
        score = match ? match[1] : '500+';
    } else if (title.includes('COMMUNICATION') || title.includes('GIAO TIẾP')) {
        type = 'CONFIDENCE';
        unit = 'LEVEL';
        score = 'PRO';
    } else {
        // IELTS or generic English
        const match = title.match(/(\d\.\d\+?)/) || desc.match(/(\d\.\d\+?)/);
        score = match ? match[1] : '7.0+';
    }

    return { type, score, unit };
};

/**
 * Returns theme configuration based on course category
 * @param {string} category - The course category
 * @returns {object} Theme configuration object
 */
const getThemeConfig = (category) => {
    const cat = (category || '').toLowerCase();
    const isTech = TECH_CATEGORIES.includes(cat);

    if (isTech) {
        // Tech Minimalist Theme
        return {
            type: 'tech',
            syllabusLayout: 'accordion',
            // Hero Section
            heroBg: 'bg-neutral-950',
            heroText: 'text-white',
            heroAccent: '#A78BFA', // Violet for tech
            heroGradient: 'from-violet-500 to-purple-600',
            heroBorder: 'border-neutral-800',
            // Accent Colors
            primaryColor: 'text-violet-400',
            primaryBg: 'bg-violet-500',
            primaryHover: 'hover:bg-violet-600',
            accentGlow: 'shadow-[0_0_15px_rgba(167,139,250,0.5)]',
            // Badge
            badgeBg: 'bg-violet-500',
            badgeText: 'text-white',
            // Selection
            selection: 'selection:bg-violet-500/20 selection:text-violet-100',
            // Section styling
            sectionBg: 'bg-neutral-900',
            sectionText: 'text-neutral-100',
            cardBg: 'bg-neutral-800',
            // CTA
            ctaBg: 'bg-violet-500',
            ctaHover: 'hover:bg-violet-400',
            ctaBorder: 'border-violet-400',
            // Decorative
            watermarkOpacity: 'opacity-10',
            showCodeDeco: true,
            showAcademicDeco: false,
        };
    } else {
        // Academic Excellence Theme
        return {
            type: 'academic',
            syllabusLayout: 'journey',
            // Hero Section
            heroBg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
            heroText: 'text-neutral-900',
            heroAccent: '#D97706', // Amber for academic
            heroGradient: 'from-amber-500 to-orange-500',
            heroBorder: 'border-amber-200',
            // Accent Colors
            primaryColor: 'text-amber-600',
            primaryBg: 'bg-amber-500',
            primaryHover: 'hover:bg-amber-600',
            accentGlow: 'shadow-[0_0_15px_rgba(217,119,6,0.3)]',
            // Badge
            badgeBg: 'bg-amber-500',
            badgeText: 'text-white',
            // Selection
            selection: 'selection:bg-amber-500/20 selection:text-amber-900',
            // Section styling
            sectionBg: 'bg-white',
            sectionText: 'text-neutral-800',
            cardBg: 'bg-amber-50',
            // CTA
            ctaBg: 'bg-amber-500',
            ctaHover: 'hover:bg-amber-600',
            ctaBorder: 'border-amber-500',
            // Decorative
            watermarkOpacity: 'opacity-5',
            showCodeDeco: false,
            showAcademicDeco: true,
        };
    }
};

// Tech Theme Decorative Component - Code Snippets
const TechDecoration = ({ accentColor }) => (
    <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm p-12 flex flex-col justify-end">
        <div className="space-y-2 opacity-30 font-mono text-xs" style={{ color: accentColor }}>
            {Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between">
                    <span>0x0{i}AF...</span>
                    <span>STATUS: {i % 2 === 0 ? 'READY' : 'WAITING'}</span>
                </div>
            ))}
        </div>
    </div>
);

// Academic Theme Decorative Component - Guarantee Seal (Premium Trust Badge)
const AcademicDecoration = ({ accentColor, certInfo }) => {
    const { type, score, unit } = certInfo || { type: 'IELTS', score: '7.0+', unit: 'BAND' };

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-6 lg:p-8 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Pattern - Subtle Diploma Lines */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${accentColor} 0px, ${accentColor} 1px, transparent 1px, transparent 20px)`
            }} />

            {/* Main Guarantee Seal */}
            <div className="relative group">
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ backgroundColor: accentColor }} />

                {/* Seal Container */}
                <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-full border-4 flex items-center justify-center shadow-2xl"
                    style={{
                        borderColor: accentColor,
                        background: `radial-gradient(circle at 30% 30%, #FEF3C7, #FDE68A, #F59E0B)`
                    }}>
                    {/* Inner Ring with Text */}
                    <div className="absolute inset-3 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${accentColor}60` }}>
                        {/* Curved Text - Top */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                            <defs>
                                <path id="topArc" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
                                <path id="bottomArc" d="M 170,110 A 65,65 0 0,1 30,110" fill="none" />
                            </defs>
                            <text className="text-[10px] font-black uppercase tracking-[0.3em]" fill={accentColor}>
                                <textPath href="#topArc" startOffset="50%" textAnchor="middle">
                                    CAM KẾT ĐẦU RA
                                </textPath>
                            </text>
                            <text className="text-[8px] font-bold uppercase tracking-[0.2em]" fill="#78350F">
                                <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
                                    HOẶC HOÀN TIỀN 100%
                                </textPath>
                            </text>
                        </svg>

                        {/* Center Content */}
                        <div className="text-center z-10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">TARGET</p>
                            <p className="text-4xl lg:text-5xl font-black text-amber-900 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                                {score}
                            </p>
                            <p className="text-[10px] font-bold text-amber-700 mt-1">{type} {unit}</p>
                        </div>
                    </div>

                    {/* Decorative Stars */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2">
                        <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                </div>

                {/* Ribbon */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg"
                    style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                    CERTIFIED
                </div>
            </div>

            {/* Trust Metrics */}
            <div className="mt-8 flex items-center gap-6 text-center">
                <div>
                    <p className="text-2xl font-black text-amber-900">2,000+</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Học viên</p>
                </div>
                <div className="w-px h-8 bg-amber-300" />
                <div>
                    <p className="text-2xl font-black text-amber-900">95%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Đạt mục tiêu</p>
                </div>
            </div>
        </div>
    );
};

// Academic Theme - 4 Pillars of Language Outcomes
const FourPillarsOutcomes = ({ accentColor, outcomes = [] }) => {
    const pillars = [
        {
            icon: Headphones,
            name: 'LISTENING',
            nameVi: 'Nghe',
            band: '7.0+',
            desc: outcomes[0] || 'Nghe hiểu tốc độ native speaker',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: BookOpen,
            name: 'READING',
            nameVi: 'Đọc',
            band: '7.0+',
            desc: outcomes[1] || 'Đọc hiểu văn bản học thuật phức tạp',
            gradient: 'from-emerald-500 to-teal-500'
        },
        {
            icon: PenTool,
            name: 'WRITING',
            nameVi: 'Viết',
            band: '6.5+',
            desc: outcomes[2] || 'Viết luận Task 1 & Task 2 mạch lạc',
            gradient: 'from-violet-500 to-purple-500'
        },
        {
            icon: Mic,
            name: 'SPEAKING',
            nameVi: 'Nói',
            band: '7.0+',
            desc: outcomes[3] || 'Giao tiếp lưu loát, tự tin phỏng vấn',
            gradient: 'from-orange-500 to-red-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, i) => (
                <div
                    key={i}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-neutral-100 overflow-hidden"
                >
                    {/* Background Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <pillar.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Skill Name */}
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-neutral-900 tracking-tight">{pillar.name}</h4>
                        <span className={`text-lg font-black bg-gradient-to-r ${pillar.gradient} bg-clip-text text-transparent`}>
                            {pillar.band}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-neutral-500 leading-relaxed">
                        {pillar.desc}
                    </p>

                    {/* Bottom Accent Line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${pillar.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                </div>
            ))}
        </div>
    );
};

// Academic Theme - Vertical Journey Map Syllabus
const AcademicJourneyMap = ({ syllabus = [], accentColor }) => {
    return (
        <div className="relative pl-12 sm:pl-16 space-y-12">
            {/* Main Journey Line */}
            <div
                className="absolute left-[23px] sm:left-[31px] top-6 bottom-0 w-1 rounded-full opacity-20"
                style={{ backgroundColor: accentColor }}
            />

            {syllabus.map((week, index) => {
                const isMilestone = (week.title || '').toUpperCase().includes('TEST') || (week.title || '').toUpperCase().includes('THI');

                return (
                    <div key={index} className="relative transition-all duration-300 group">
                        {/* Weekly Node (Circle) */}
                        <div
                            className={`absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 bg-white flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-125`}
                            style={{ borderColor: accentColor }}
                        >
                            {isMilestone ? (
                                <Trophy className="w-4 h-4" style={{ color: accentColor }} />
                            ) : (
                                <span className="text-[10px] font-black" style={{ color: accentColor }}>W{index + 1}</span>
                            )}
                        </div>

                        {/* Stage Divider (Optional - based on week number) */}
                        {(index === 0 || index === Math.floor(syllabus.length / 2) || index === syllabus.length - 1) && (
                            <div className="absolute -left-[50px] -top-8 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: accentColor }}>
                                {index === 0 ? 'KHỞI ĐẦU' : index === syllabus.length - 1 ? 'VỀ ĐÍCH' : 'BỨT PHÁ'}
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-neutral-100 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                                <h4 className="text-xl font-black text-neutral-900 leading-tight uppercase font-serif tracking-tight">
                                    {week.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                                        {week.topics?.length || 0} Lessons
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {week.topics?.map((topic, i) => (
                                    <div key={i} className="flex gap-3 items-start group/item">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center flex-shrink-0 group-hover/item:border-amber-500 transition-colors">
                                            <CheckCircle className="w-3 h-3 text-neutral-300 group-hover/item:text-amber-500" />
                                        </div>
                                        <p className="text-sm text-neutral-600 group-hover/item:text-neutral-900 transition-colors">{topic}</p>
                                    </div>
                                ))}
                            </div>

                            {isMilestone && (
                                <div className="mt-6 pt-6 border-t border-dashed border-neutral-200 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-50">
                                        <Target className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-900 uppercase">Milestone check</p>
                                        <p className="text-[10px] text-neutral-500">Đánh giá kết quả để chuẩn bị cho giai đoạn tiếp theo.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ============================================
// STYLES & HELPERS
// ============================================

const DotGridPattern = () => (
    <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
        }}
    />
);

const LoadingSkeleton = () => (
    <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="pt-20">
            {/* Hero Skeleton */}
            <div className="bg-neutral-900 h-[60vh] relative overflow-hidden">
                <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 h-full">
                    <div className="lg:col-span-8 p-8 lg:p-20 flex flex-col justify-center gap-6">
                        <div className="w-32 h-6 bg-neutral-800 animate-pulse rounded" />
                        <div className="w-3/4 h-20 bg-neutral-800 animate-pulse rounded" />
                        <div className="w-1/2 h-10 bg-neutral-800 animate-pulse rounded" />
                        <div className="grid grid-cols-4 gap-8 mt-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-neutral-800 animate-pulse rounded" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12">
                <div className="lg:col-span-8 p-8 lg:p-16 space-y-12">
                    <div className="h-32 bg-neutral-100 animate-pulse rounded" />
                    <div className="h-96 bg-neutral-100 animate-pulse rounded" />
                </div>
                <div className="lg:col-span-4 p-8 lg:p-12">
                    <div className="h-[500px] bg-neutral-900 animate-pulse rounded shadow-2xl" />
                </div>
            </div>
        </div>
    </div>
);

const AccordionItem = ({ title, active, onClick, index, children, metadata }) => (
    <div className={`relative group transition-all duration-300 ${active ? 'bg-neutral-50/80 shadow-inner' : index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/20'}`}>
        {/* Timeline Line */}
        <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-neutral-100 group-last:bg-gradient-to-b group-last:from-neutral-100 group-last:to-transparent" />

        {/* Timeline Dot */}
        <div className={`absolute left-[34px] top-8 w-[14px] h-[14px] rounded-full border-2 transition-all duration-500 z-10 ${active ? 'bg-[#FF4D00] border-[#FF4D00] scale-125 shadow-[0_0_10px_rgba(255,77,0,0.3)]' : 'bg-white border-neutral-300 scale-100'
            }`} />

        <button
            onClick={onClick}
            className="w-full py-8 flex items-start md:items-center justify-between text-left pl-20 pr-8 group-hover:pl-22 transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 flex-1">
                <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-neutral-400 font-bold uppercase tracking-widest">
                        MODULE {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="h-4 w-[1px] bg-neutral-200 hidden md:block" />
                </div>
                <div className="space-y-1">
                    <span className={`text-xl font-bold uppercase tracking-tight transition-colors duration-300 ${active ? 'text-[#FF4D00]' : 'text-neutral-900'}`}>
                        {title}
                    </span>
                    {metadata && (
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> {metadata.lessons} Lessons</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {metadata.exercises} Exercises</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {metadata.duration}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className={`mt-1 md:mt-0 w-8 h-8 flex items-center justify-center rounded-sm border transition-all duration-300 ${active ? 'border-[#FF4D00] bg-[#FF4D00] text-white rotate-180 shadow-lg' : 'border-neutral-200 text-neutral-400 group-hover:border-neutral-900 group-hover:text-neutral-900'}`}>
                {active ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
        </button>

        <div
            className={`overflow-hidden transition-all ease-[cubic-bezier(0.4,0,0.2,1)] ${active
                ? 'max-h-[2000px] opacity-100 duration-500'
                : 'max-h-0 opacity-0 duration-300'
                }`}
        >
            <div className="pl-20 pr-8 pb-10">
                <div className="grid gap-2 border-l-2 border-[#FF4D00]/10 ml-0 pl-6 pt-2">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

// ============================================
// CONSULTATION MODAL (NEO-SWISS STYLE)
// ============================================

const ConsultationModal = ({ isOpen, onClose, courseId, courseName }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('consultation_requests')
                .insert({
                    ...formData,
                    course_id: courseId,
                    source: 'website_course_detail',
                    status: 'new'
                });

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting consultation:', err);
            alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-sm">
            <div className="bg-white max-w-lg w-full shadow-2xl relative border-4 border-neutral-900 animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-neutral-200 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                    <ChevronDown className="w-5 h-5 rotate-45" />
                </button>

                {success ? (
                    <div className="text-center py-12 px-8">
                        <div className="w-20 h-20 bg-[#FF4D00] text-white flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black text-neutral-900 mb-2 uppercase tracking-tighter">Đã nhận yêu cầu!</h3>
                        <p className="text-neutral-600 mb-8 font-mono text-sm leading-relaxed">
                            Dữ liệu của bạn đã được ghi nhận vào hệ thống.
                            <br />Chuyên viên tư vấn sẽ liên hệ trong vòng 24h.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-neutral-900 text-white font-bold uppercase tracking-widest hover:bg-[#FF4D00] transition-colors border-2 border-transparent hover:border-black"
                        >
                            Đóng
                        </button>
                    </div>
                ) : (
                    <div className="p-8 lg:p-10">
                        <div className="mb-8 border-b-4 border-[#FF4D00] pb-4 inline-block">
                            <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter">Tư vấn miễn phí</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Họ và tên *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full p-4 border-2 border-neutral-200 focus:border-neutral-900 bg-neutral-50 focus:bg-white outline-none transition-colors font-medium"
                                    placeholder="Nhập họ và tên..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-4 border-2 border-neutral-200 focus:border-neutral-900 bg-neutral-50 focus:bg-white outline-none transition-colors font-mono"
                                        placeholder="09xx..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-4 border-2 border-neutral-200 focus:border-neutral-900 bg-neutral-50 focus:bg-white outline-none transition-colors"
                                        placeholder="example@..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Ghi chú</label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-4 border-2 border-neutral-200 focus:border-neutral-900 bg-neutral-50 focus:bg-white outline-none transition-colors resize-none"
                                    placeholder="Câu hỏi của bạn..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-neutral-900 text-white font-bold uppercase tracking-widest hover:bg-[#FF4D00] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                {loading ? 'Processing...' : 'Gửi yêu cầu'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// MOBILE FIXED ACTION BAR
// ============================================

const MobileActionBar = ({ price, onRegister, onConsult, theme }) => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500">
        <div className="flex-shrink-0">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Học phí</p>
            <p className="text-lg font-black text-neutral-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)}</p>
        </div>
        <div className="flex flex-1 gap-2">
            <button
                onClick={onConsult}
                className="flex-1 py-3 border-2 border-neutral-900 text-neutral-900 text-xs font-black uppercase tracking-widest"
            >
                Tư vấn
            </button>
            <Link
                to="/register"
                className={`flex-1 py-3 text-white text-xs font-black uppercase tracking-widest text-center ${theme.ctaBg}`}
            >
                Đăng ký
            </Link>
        </div>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const CourseDetailPage = () => {
    const { id } = useParams(); // Should be slug or id
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSyllabus, setActiveSyllabus] = useState(0);
    const [activeFaq, setActiveFaq] = useState(null);
    const [showConsultation, setShowConsultation] = useState(false);

    useEffect(() => {
        fetchCourseDetail();
        window.scrollTo(0, 0); // Scroll to top on load
    }, [id]);

    const fetchCourseDetail = async () => {
        try {
            setLoading(true);

            // Try to find by Slug first
            let { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('slug', id)
                .single();

            // If not found by slug, try by code
            if (error && error.code === 'PGRST116') {
                const { data: dataCode, error: errorCode } = await supabase
                    .from('courses')
                    .select('*')
                    .ilike('code', id.replace(/-/g, '%'))
                    .single();

                if (!errorCode && dataCode) {
                    data = dataCode;
                    error = null;
                }
            }

            // If still not found, try by title (fuzzy search)
            if (error && error.code === 'PGRST116') {
                const searchTerm = id.replace(/-/g, ' ');
                const { data: dataTitle, error: errorTitle } = await supabase
                    .from('courses')
                    .select('*')
                    .ilike('title', `%${searchTerm}%`)
                    .limit(1)
                    .single();

                if (!errorTitle && dataTitle) {
                    data = dataTitle;
                    error = null;
                }
            }

            // Finally try by UUID if it looks like one
            if (error && error.code === 'PGRST116') {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
                if (isUUID) {
                    const { data: dataId, error: errorId } = await supabase
                        .from('courses')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (!errorId && dataId) {
                        data = dataId;
                        error = null;
                    }
                }
            }

            if (error) throw error;
            setCourse(data);
        } catch (err) {
            console.error("Error fetching course:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSkeleton />;
    if (!course) return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="text-center">
                <h1 className="text-4xl font-black mb-4">404</h1>
                <p className="text-neutral-500 mb-8">Course Data Not Found</p>
                <Link to="/courses" className="px-6 py-3 bg-neutral-900 hover:bg-[#FF4D00] text-white font-bold uppercase tracking-widest transition-colors">
                    Return Home
                </Link>
            </div>
        </div>
    );

    // Parse JSON fields
    const syllabus = typeof course.syllabus === 'string' ? JSON.parse(course.syllabus) : course.syllabus || [];
    const features = typeof course.features === 'string' ? JSON.parse(course.features) : course.features || [];
    const outcomes = typeof course.outcomes === 'string' ? JSON.parse(course.outcomes) : course.outcomes || [];
    const faq = typeof course.faq === 'string' ? JSON.parse(course.faq) : course.faq || [];

    // Get dynamic theme based on course category
    const theme = getThemeConfig(course.category);
    const isTechTheme = theme.type === 'tech';
    const certInfo = extractCourseCertInfo(course);

    return (
        <div className={`min-h-screen bg-white antialiased font-sans ${theme.selection}`}>
            <Helmet>
                <title>{course?.title ? `${course.title} | Lộ trình Skill Master` : 'Chi tiết khóa học | Skill Master'}</title>
                <meta name="description" content={course?.description ? `${course.description.substring(0, 150)}...` : 'Thông tin chi tiết về khóa học tại Skill Master. Đăng ký ngay để nhận ưu đãi.'} />
                <meta property="og:title" content={course?.title ? `${course.title} | Skill Master` : 'Chi tiết khóa học | Skill Master'} />
                <meta property="og:description" content={course?.description || 'Thông tin chi tiết về khóa học tại Skill Master.'} />
                <meta property="og:type" content="website" />
            </Helmet>
            <PublicHeader />

            <main className="pt-20">
                {/* DYNAMIC HERO SECTION */}
                <section className={`relative ${theme.heroBg} ${theme.heroText} overflow-hidden border-b ${theme.heroBorder}`}>
                    {/* Dot Grid Pattern - Only for Tech Theme */}
                    {isTechTheme && <DotGridPattern />}

                    {/* Giant Watermark */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none select-none">
                        <span className="text-[20vw] font-black leading-none text-white whitespace-nowrap">
                            {course.category}
                        </span>
                    </div>

                    <div className="max-w-[1600px] mx-auto relative z-10">
                        <div className="grid lg:grid-cols-12 min-h-[70vh]">
                            {/* Content */}
                            <div className="lg:col-span-8 p-8 lg:p-20 flex flex-col justify-center border-b lg:border-b-0 lg:border-r" style={{ borderColor: isTechTheme ? '#3f3f46' : '#fde68a' }}>

                                <div className="flex flex-wrap items-center gap-4 mb-8">
                                    <span className={`px-4 py-1.5 ${theme.badgeBg} ${theme.badgeText} text-xs font-bold uppercase tracking-[0.2em] shadow-lg`}>
                                        {course.category || 'Course'}
                                    </span>
                                    {course.code && (
                                        <span className="font-mono text-sm" style={{ color: theme.heroAccent }}>
                                            #{course.code}
                                        </span>
                                    )}
                                </div>

                                <h1 className={`text-5xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] mb-8 ${isTechTheme ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400' : 'text-neutral-900 font-serif'}`}>
                                    {course.title}
                                </h1>

                                <p className={`text-xl lg:text-2xl leading-relaxed max-w-2xl mb-12 font-light border-l-4 pl-6 ${isTechTheme ? 'text-neutral-400' : 'text-neutral-600'}`} style={{ borderColor: theme.heroAccent }}>
                                    {course.description || 'Chương trình đào tạo chuyên sâu.'}
                                </p>

                                {/* Specs Grid */}
                                <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t ${isTechTheme ? 'border-neutral-800' : 'border-amber-200'}`}>
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${isTechTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>Duration</p>
                                        <div className={`flex items-end gap-2 ${theme.heroText}`}>
                                            <Clock className="w-5 h-5 mb-1" style={{ color: theme.heroAccent }} />
                                            <span className="text-2xl font-mono font-bold">{course.duration_weeks || '—'}</span>
                                            <span className="text-xs text-neutral-500 mb-1.5">Wks</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${isTechTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>Sessions</p>
                                        <div className={`flex items-end gap-2 ${theme.heroText}`}>
                                            <Calendar className="w-5 h-5 mb-1" style={{ color: theme.heroAccent }} />
                                            <span className="text-2xl font-mono font-bold">{course.total_sessions || '—'}</span>
                                            <span className="text-xs text-neutral-500 mb-1.5">Ses</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${isTechTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>Class Size</p>
                                        <div className={`flex items-end gap-2 ${theme.heroText}`}>
                                            <Users className="w-5 h-5 mb-1" style={{ color: theme.heroAccent }} />
                                            <span className="text-2xl font-mono font-bold">12</span>
                                            <span className="text-xs text-neutral-500 mb-1.5">Max</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${isTechTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>Level</p>
                                        <div className={`flex items-end gap-2 ${theme.heroText}`}>
                                            <Hash className="w-5 h-5 mb-1" style={{ color: theme.heroAccent }} />
                                            <span className="text-lg font-bold truncate max-w-[100px]">{course.level || 'All'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Right Panel - Theme-specific */}
                            <div className="hidden lg:block lg:col-span-4 relative overflow-hidden">
                                {theme.showCodeDeco && <TechDecoration accentColor={theme.heroAccent} />}
                                {theme.showAcademicDeco && <AcademicDecoration accentColor={theme.heroAccent} certInfo={certInfo} />}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12">
                    {/* LEFT CONTENT COLUMN */}
                    <div className="lg:col-span-8 border-r border-neutral-200">

                        {/* FEATURES LIST - Show ALL features */}
                        {features.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-200 bg-neutral-50">
                                {features.map((feature, i) => (
                                    <div key={i} className="p-6 border-r border-neutral-200 last:border-r-0 flex flex-col gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4" style={{ color: theme.heroAccent }} />
                                        </div>
                                        <p className="text-xs font-bold text-neutral-700 uppercase leading-snug">{feature}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* OUTCOMES SECTION - Conditional Layout */}
                        {outcomes.length > 0 && (
                            <section className="p-8 lg:p-16 border-b border-neutral-200">
                                <div className="flex items-baseline gap-4 mb-4">
                                    <span className="text-6xl font-black select-none -mb-8 pointer-events-none" style={{ color: theme.heroAccent, opacity: 0.2 }}>01</span>
                                    <h2 className={`text-3xl font-black text-neutral-900 uppercase tracking-tighter relative z-10 ${!isTechTheme ? 'font-serif' : ''}`}>
                                        {isTechTheme ? 'Mục tiêu đầu ra' : 'Bạn sẽ đạt được'}
                                    </h2>
                                </div>
                                <p className="text-neutral-500 max-w-2xl mb-12 font-light">
                                    {isTechTheme
                                        ? 'Cam kết chất lượng đào tạo với chuẩn đầu ra khắt khe.'
                                        : 'Làm chủ 4 kỹ năng cốt lõi để chinh phục mục tiêu IELTS của bạn.'}
                                </p>

                                {/* ACADEMIC: 4 Pillars Layout */}
                                {!isTechTheme && (
                                    <FourPillarsOutcomes accentColor={theme.heroAccent} outcomes={outcomes} />
                                )}

                                {/* TECH: Bento Grid Layout */}
                                {isTechTheme && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-full min-h-[500px]">

                                        {/* CARD 1: HERO - THE BIG PICTURE (Col-span-2) */}
                                        <div className={`md:col-span-2 md:row-span-1 group relative p-8 ${isTechTheme ? 'bg-neutral-900 hover:bg-black' : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'} text-white overflow-hidden flex flex-col justify-between transition-colors duration-500 shadow-xl`}>
                                            <div className="absolute top-0 right-0 p-8 opacity-5 font-mono text-9xl select-none leading-none -mr-8 -mt-8">01</div>
                                            <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform translate-y-1/4 translate-x-1/4">
                                                <Target className="w-64 h-64 text-white" />
                                            </div>

                                            <div className="relative z-10">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-6 ${isTechTheme ? 'bg-violet-500' : 'bg-white/20'}`} style={{ boxShadow: `0 0 15px ${theme.heroAccent}40` }}>
                                                    <Zap className="w-4 h-4 text-white" />
                                                </div>
                                                <h4 className="font-mono text-xs mb-3 uppercase tracking-widest text-white/80">Core Competency</h4>
                                                <p className="text-2xl lg:text-3xl font-black leading-tight uppercase max-w-md text-white">
                                                    {outcomes[0] || "Master Core Principles"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* CARD 2: DEPTH (Row-span-2) */}
                                        <div className="md:col-span-1 md:row-span-2 group relative p-6 border-2 border-neutral-100 bg-white transition-all duration-300 flex flex-col justify-between overflow-hidden hover:shadow-2xl" style={{ '--hover-border': theme.heroAccent }} onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.heroAccent} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#f5f5f5'}>
                                            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-colors" style={{ backgroundColor: `${theme.heroAccent}10` }} />

                                            <div>
                                                <div className="font-mono text-xs text-neutral-400 mb-8 pt-2 border-t border-neutral-200 w-8">02</div>
                                                <Code className="w-10 h-10 text-neutral-800 mb-6 group-hover:transition-colors" style={{ '--hover-color': theme.heroAccent }} />
                                                <h4 className="font-bold text-lg leading-tight mb-2 text-neutral-900">
                                                    {outcomes[1] || "Production Ready Skills"}
                                                </h4>
                                            </div>

                                            <div className="opacity-60 group-hover:opacity-100 transition-opacity text-sm text-neutral-500 leading-relaxed mt-4">
                                                {isTechTheme ? 'Xây dựng dự án thực tế với tiêu chuẩn doanh nghiệp.' : 'Áp dụng kiến thức vào thực tế một cách tự tin.'}
                                            </div>

                                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0" style={{ color: theme.heroAccent }}>
                                                <ArrowRight className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* CARD 3: TECHNICAL TOOLING (1x1) */}
                                        <div className="md:col-span-1 md:row-span-1 group relative p-6 bg-neutral-50 hover:bg-[#FF4D00] transition-colors duration-300 overflow-hidden">
                                            <div className="relative z-10 h-full flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-mono text-xs mb-2 text-neutral-400 group-hover:text-white/60">SKILL.03</p>
                                                    <Trophy className="w-5 h-5 text-neutral-300 group-hover:text-white" />
                                                </div>
                                                <p className="font-bold text-neutral-900 group-hover:text-white text-lg leading-snug">
                                                    {outcomes[2] || "Advanced Techniques"}
                                                </p>
                                            </div>
                                            <div className="absolute -bottom-4 -right-4 text-neutral-200 group-hover:text-white/10 opacity-50 transform rotate-12 transition-colors">
                                                <Globe className="w-24 h-24" />
                                            </div>
                                        </div>

                                        {/* CARD 4: CAREER / CERT (1x1) */}
                                        <div className="md:col-span-1 md:row-span-1 group relative p-6 bg-white border border-dashed border-neutral-300 hover:border-solid hover:border-neutral-900 transition-all duration-300">
                                            <div className="relative z-10">
                                                <p className="font-mono text-xs mb-4" style={{ color: theme.heroAccent }}>CERTIFICATION</p>
                                                <p className="font-bold text-neutral-900 text-lg mb-2">
                                                    {outcomes[3] || "Job Ready"}
                                                </p>
                                                <div className="flex -space-x-2 overflow-hidden py-2 mt-4">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="inline-block h-6 w-6 rounded-full border-2 border-white bg-neutral-200" />
                                                    ))}
                                                    <div className="h-6 w-6 rounded-full border-2 border-white bg-neutral-900 flex items-center justify-center text-[8px] text-white font-bold">+99</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fill remaining outcomes if any (Standard List) */}
                                        {outcomes.slice(4).map((item, i) => (
                                            <div key={i + 4} className="md:col-span-1 p-6 border-l border-b border-neutral-200 flex items-center gap-3 bg-white">
                                                <div className="w-2 h-2" style={{ backgroundColor: theme.heroAccent }}></div>
                                                <span className="font-medium text-sm text-neutral-600">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Skills Badge Cloud - Only for Tech Theme */}
                                {isTechTheme && (
                                    <div className="mt-8 pt-8 border-t border-neutral-100 overflow-hidden">
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 text-center">Technologies You Will Master</p>
                                        <div className="relative flex flex-wrap justify-center gap-3">
                                            {['React', 'Node.js', 'TypeScript', 'Docker', 'AWS', 'Next.js', 'Supabase', 'Tailwind', 'Redis', 'GraphQL'].map((tech, i) => (
                                                <span
                                                    key={i}
                                                    className="px-4 py-1.5 rounded-full border border-neutral-200 text-xs font-mono font-bold text-neutral-600 bg-neutral-50 transition-all cursor-default"
                                                    style={{ transitionDelay: `${i * 50}ms` }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.heroAccent; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = theme.heroAccent; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; e.currentTarget.style.color = '#525252'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* SYLLABUS SECTION - ROADMAP REVOLUTION */}
                        {syllabus.length > 0 && (
                            <section className="border-b border-neutral-200 bg-white">
                                <div className="p-8 lg:p-16 pb-8">
                                    <div className="flex items-baseline gap-4 mb-4">
                                        <span className="text-6xl font-black select-none -mb-8 pointer-events-none tracking-tighter" style={{ color: theme.heroAccent, opacity: 0.2 }}>02</span>
                                        <h2 className={`text-3xl font-black text-neutral-900 uppercase tracking-tighter relative z-10 ${!isTechTheme ? 'font-serif' : ''}`}>
                                            {isTechTheme ? 'Lộ trình học tập' : 'Lộ trình chinh phục'}
                                        </h2>
                                    </div>
                                    <p className="text-neutral-500 max-w-2xl font-light">
                                        {isTechTheme
                                            ? 'Chương trình được thiết kế theo lộ trình từ con số 0 đến khi làm chủ dự án thực tế.'
                                            : 'Kế hoạch học tập chi tiết, bám sát cấu trúc bài thi và tối ưu hóa thời gian thực hành.'}
                                    </p>
                                </div>

                                <div className="p-8 lg:p-16 pt-0 pb-16">
                                    {theme.syllabusLayout === 'journey' ? (
                                        <AcademicJourneyMap syllabus={syllabus} accentColor={theme.heroAccent} />
                                    ) : (
                                        <div className="space-y-4">
                                            {syllabus.map((week, index) => (
                                                <AccordionItem
                                                    key={index}
                                                    index={index}
                                                    title={week.title}
                                                    active={activeSyllabus === index}
                                                    onClick={() => setActiveSyllabus(activeSyllabus === index ? null : index)}
                                                    metadata={{
                                                        lessons: week.topics?.length || 4,
                                                        exercises: Math.ceil((week.topics?.length || 4) / 2),
                                                        duration: `${(week.topics?.length || 4) * 45} mins`
                                                    }}
                                                >
                                                    <div className="space-y-3">
                                                        {week.topics?.map((topic, i) => {
                                                            const isPreview = index === 0 && i < 2;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`group/item flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isPreview
                                                                        ? 'bg-neutral-50 border-neutral-200 hover:bg-white hover:shadow-md'
                                                                        : 'bg-white border-transparent hover:bg-neutral-50'
                                                                        }`}
                                                                    style={{ borderColor: isPreview ? `${theme.heroAccent}20` : 'transparent' }}
                                                                    onMouseEnter={(e) => { if (isPreview) e.currentTarget.style.borderColor = theme.heroAccent; }}
                                                                    onMouseLeave={(e) => { if (isPreview) e.currentTarget.style.borderColor = `${theme.heroAccent}20`; }}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors`}
                                                                            style={{
                                                                                backgroundColor: isPreview ? `${theme.heroAccent}10` : '#f5f5f5',
                                                                                color: isPreview ? theme.heroAccent : '#a3a3a3'
                                                                            }}>
                                                                            {isPreview ? <PlayCircle className="w-5 h-5" /> : (i % 2 === 0 ? <FileText className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />)}
                                                                        </div>
                                                                        <div>
                                                                            <p className={`text-sm font-bold transition-colors`} style={{ color: isPreview ? '#171717' : '#525252' }}>
                                                                                {topic}
                                                                            </p>
                                                                            <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5">
                                                                                {i % 2 === 0 ? 'Video Lecture' : 'Interactive Lab'} • 15:00
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {isPreview ? (
                                                                        <button
                                                                            className="px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm hover:scale-105 transition-transform active:scale-95"
                                                                            style={{ backgroundColor: theme.heroAccent }}
                                                                        >
                                                                            Học thử
                                                                        </button>
                                                                    ) : (
                                                                        <div className="p-2 opacity-20 group-hover/item:opacity-50 transition-opacity">
                                                                            <Lock className="w-4 h-4 text-neutral-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionItem>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* FAQ SECTION */}
                        {faq.length > 0 && (
                            <section className="bg-neutral-50/50">
                                <div className="p-8 lg:p-16 pb-8">
                                    <div className="flex items-baseline gap-4 mb-8">
                                        <span className="text-6xl font-black select-none -mb-8 pointer-events-none" style={{ color: theme.heroAccent, opacity: 0.2 }}>03</span>
                                        <h2 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter relative z-10">FAQ</h2>
                                    </div>
                                </div>
                                <div className="px-8 lg:px-16 pb-16">
                                    {faq.map((item, index) => (
                                        <div key={index} className="bg-white border border-neutral-200 mb-4 hover:border-neutral-900 transition-colors">
                                            <button
                                                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                                className="w-full p-6 text-left flex justify-between items-center"
                                            >
                                                <span className="font-bold text-neutral-900">{item.question}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div
                                                className={`overflow-hidden transition-all ease-[cubic-bezier(0.4,0,0.2,1)] ${activeFaq === index
                                                    ? 'max-h-[1000px] opacity-100 duration-500'
                                                    : 'max-h-0 opacity-0 duration-300'
                                                    }`}
                                            >
                                                <div className="px-6 pb-6 text-neutral-700 text-base leading-[1.7] border-t border-neutral-100 pt-4">
                                                    {item.answer}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR - STICKY TICKET */}
                    <div className="lg:col-span-4 p-6 lg:p-12 bg-neutral-50">
                        <div className="sticky top-28 space-y-8">

                            {/* Ticket Card - PREMIUM PASS STYLE */}
                            <div className="bg-neutral-950 border-t-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 relative overflow-hidden group" style={{ borderTopColor: theme.heroAccent }}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 grayscale group-hover:opacity-20 transition-opacity">
                                    <Zap className="w-20 h-20 text-white" />
                                </div>

                                <div className="text-center pb-8 border-b border-neutral-800">
                                    <div className="inline-block px-3 py-1 rounded-full mb-4" style={{ backgroundColor: `${theme.heroAccent}15`, border: `1px solid ${theme.heroAccent}30` }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.heroAccent }}>Limited Enrollment</p>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Total Professional Tuition</p>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl lg:text-6xl font-black tracking-tighter" style={{ color: theme.heroAccent, textShadow: `0 0 15px ${theme.heroAccent}40` }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price || 0)}
                                        </span>
                                        <div className="flex items-center gap-2 mt-2 text-neutral-400">
                                            <ShieldCheck className="w-4 h-4 text-green-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">100% Satisfaction Guarantee</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Proof & Urgency */}
                                <div className="py-6 space-y-4">
                                    <div className="flex items-center justify-between group/info">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
                                                <Users className="w-4 h-4" style={{ color: theme.heroAccent }} />
                                            </div>
                                            <span className="text-xs font-bold text-neutral-300">Học viên mới tuần này</span>
                                        </div>
                                        <span className="text-sm font-black text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">127+</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
                                                <Calendar className="w-4 h-4" style={{ color: theme.heroAccent }} />
                                            </div>
                                            <span className="text-xs font-bold text-neutral-300">Khai giảng dự kiến</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-white uppercase">05/01/2025</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Link
                                        to="/register"
                                        className={`relative w-full py-5 ${theme.ctaBg} text-white font-black uppercase tracking-widest ${theme.ctaHover} hover:text-black transition-all flex items-center justify-center gap-2 group/btn overflow-hidden`}
                                        style={{ boxShadow: `0 10px 20px ${theme.heroAccent}30` }}
                                    >
                                        <span className="relative z-10">Đăng ký ngay</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform relative z-10" />
                                    </Link>
                                    <button
                                        onClick={() => setShowConsultation(true)}
                                        className="w-full py-4 bg-transparent border-2 border-neutral-800 text-neutral-400 font-black uppercase tracking-widest hover:border-white hover:text-white transition-all text-sm"
                                    >
                                        Nhận tư vấn miễn phí
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-neutral-800">
                                    <div className="flex items-center justify-center gap-4 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                        <CreditCard className="w-6 h-6 text-white" />
                                        <div className="text-[10px] font-mono text-neutral-500 uppercase leading-none text-left">
                                            Secure Checkout<br />
                                            <span className="text-neutral-600">Banking / Momo / Credit</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Human-Centric Support Card */}
                            <div className="relative p-8 bg-white border border-neutral-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                                <div className="flex items-start gap-5">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center overflow-hidden border border-neutral-200">
                                            <img
                                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=ff4d00"
                                                alt="Support Specialist"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00]">Direct Support</p>
                                        <h4 className="text-lg font-black text-neutral-900 leading-tight uppercase">Bạn cần hỗ trợ?</h4>
                                        <p className="text-xs text-neutral-500 font-medium italic">"Tôi sẽ đồng hành cùng bạn chọn lộ trình phù hợp nhất."</p>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-1 gap-2">
                                    <a
                                        href="tel:0909123456"
                                        className="w-full py-4 bg-neutral-900 text-white rounded-none flex items-center justify-center gap-3 hover:bg-[#FF4D00] transition-colors group"
                                    >
                                        <Phone className="w-4 h-4 group-hover:animate-bounce" />
                                        <span className="text-sm font-black uppercase tracking-widest">0909 123 456</span>
                                    </a>
                                    <div className="text-center mt-2">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                            Phản hồi ngay lập tức (24/7)
                                        </span>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 p-2">
                                    <Headphones className="w-12 h-12 text-neutral-50 opacity-50" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* MOBILE ACTION BAR */}
                <MobileActionBar
                    price={course?.price}
                    onRegister={() => { }}
                    onConsult={() => setShowConsultation(true)}
                    theme={theme}
                />

                {/* CONSULTATION MODAL */}
                <ConsultationModal
                    isOpen={showConsultation}
                    onClose={() => setShowConsultation(false)}
                    courseId={course?.id}
                    courseName={course?.title}
                />
            </main>

            <Footer />
        </div>
    );
};

export default CourseDetailPage;

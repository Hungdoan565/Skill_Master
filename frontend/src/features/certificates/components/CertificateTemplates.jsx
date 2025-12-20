/**
 * CertificateTemplates - Các mẫu thiết kế chứng chỉ đẹp
 * 
 * Hỗ trợ các loại:
 * - Classic Gold: Cổ điển sang trọng (Anh ngữ)
 * - Modern Blue: Hiện đại công nghệ (Tin học)
 * - Professional Purple: Chuyên nghiệp (Lập trình)
 * - Elegant Warm: Ấm áp (Kỹ năng mềm)
 */

import React from 'react';
import { Award, CheckCircle, Shield, Star, Globe, BookOpen, Code, Users } from 'lucide-react';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const formatDateEnglish = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

// Get grade display info
const getGradeInfo = (grade) => {
    const grades = {
        'Xuất sắc': { color: '#FFD700', label: 'DISTINCTION', labelVi: 'XUẤT SẮC' },
        'Giỏi': { color: '#C0C0C0', label: 'MERIT', labelVi: 'GIỎI' },
        'Khá': { color: '#CD7F32', label: 'CREDIT', labelVi: 'KHÁ' },
        'Đạt': { color: '#4CAF50', label: 'PASS', labelVi: 'ĐẠT' },
    };
    return grades[grade] || { color: '#4CAF50', label: 'PASS', labelVi: 'ĐẠT' };
};

// Category icons
const getCategoryIcon = (category) => {
    const icons = {
        language: Globe,
        office: BookOpen,
        programming: Code,
        soft_skill: Users,
    };
    return icons[category] || Award;
};

// ============================================================
// DECORATIVE COMPONENTS
// ============================================================

// Corner Ornament SVG
const CornerOrnament = ({ position = 'top-left', color = '#d4af37' }) => {
    const rotations = {
        'top-left': 'rotate(0)',
        'top-right': 'rotate(90deg)',
        'bottom-right': 'rotate(180deg)',
        'bottom-left': 'rotate(270deg)'
    };

    return (
        <svg
            className={`absolute w-24 h-24 ${position.replace('-', ' ')}`}
            style={{
                transform: rotations[position],
                top: position.includes('top') ? '20px' : 'auto',
                bottom: position.includes('bottom') ? '20px' : 'auto',
                left: position.includes('left') ? '20px' : 'auto',
                right: position.includes('right') ? '20px' : 'auto',
            }}
            viewBox="0 0 100 100"
            fill="none"
        >
            <path
                d="M5 5 L5 30 Q5 5 30 5 Z"
                fill={color}
                opacity="0.8"
            />
            <path
                d="M10 10 L10 50 Q10 10 50 10"
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
            <path
                d="M15 15 L15 40 Q15 15 40 15"
                stroke={color}
                strokeWidth="1"
                fill="none"
            />
            {/* Decorative swirl */}
            <circle cx="8" cy="8" r="3" fill={color} />
            <circle cx="20" cy="8" r="2" fill={color} opacity="0.6" />
            <circle cx="8" cy="20" r="2" fill={color} opacity="0.6" />
        </svg>
    );
};

// Official Seal
const OfficialSeal = ({ text = 'OFFICIAL', color = '#d4af37', size = 100 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
        {/* Outer ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="1" />

        {/* Inner circle */}
        <circle cx="50" cy="50" r="38" fill={color} opacity="0.1" />
        <circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 2" />

        {/* Star in center */}
        <polygon
            points="50,20 55,40 75,40 59,52 65,72 50,60 35,72 41,52 25,40 45,40"
            fill={color}
            opacity="0.8"
        />

        {/* Text around seal */}
        <defs>
            <path id="circlePath" d="M 50, 50 m -32, 0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
        </defs>
        <text fontSize="8" fontWeight="bold" fill={color}>
            <textPath href="#circlePath" startOffset="0%">
                ★ CERTIFIED ★ AUTHENTIC ★ VERIFIED ★
            </textPath>
        </text>
    </svg>
);

// QR Code Placeholder (in real app, use qrcode library)
const QRCodePlaceholder = ({ value, size = 80 }) => (
    <div
        className="bg-white p-2 rounded shadow-inner"
        style={{ width: size, height: size }}
    >
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-600 rounded flex items-center justify-center">
            <div className="grid grid-cols-5 gap-0.5 p-1">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}
                    />
                ))}
            </div>
        </div>
    </div>
);

// ============================================================
// TEMPLATE 1: CLASSIC GOLD (Anh ngữ)
// ============================================================
export const ClassicGoldTemplate = ({ certificate, certificateType, centerInfo }) => {
    const gradeInfo = getGradeInfo(certificate?.grade);
    const scores = certificate?.scores || {};
    const scoreConfig = certificateType?.score_config || {};

    return (
        <div
            className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-8"
            style={{
                width: '297mm',
                height: '210mm',
                fontFamily: "'Cormorant Garamond', 'Times New Roman', serif"
            }}
        >
            {/* Decorative Border */}
            <div className="absolute inset-4 border-[12px] border-double border-amber-500/70 rounded-lg" />
            <div className="absolute inset-6 border-2 border-amber-400/50 rounded-lg" />
            <div className="absolute inset-7 border border-amber-300/40 rounded" />

            {/* Corner Ornaments */}
            <CornerOrnament position="top-left" color="#d4af37" />
            <CornerOrnament position="top-right" color="#d4af37" />
            <CornerOrnament position="bottom-left" color="#d4af37" />
            <CornerOrnament position="bottom-right" color="#d4af37" />

            {/* Content Container */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
                {/* Logo & Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg ring-4 ring-amber-200">
                        <Award className="h-10 w-10 text-white" />
                    </div>
                </div>

                {/* Center Name */}
                <h1 className="text-2xl font-bold text-amber-800 tracking-[0.3em] uppercase mb-1">
                    {centerInfo?.name || 'SKILL MASTER'}
                </h1>
                <p className="text-sm text-amber-600 tracking-wider mb-6">
                    {centerInfo?.slogan || 'Training & Education Center'}
                </p>

                {/* Certificate Title */}
                <div className="mb-6">
                    <p className="text-lg text-slate-600 italic mb-2">proudly presents this</p>
                    <h2 className="text-4xl font-bold text-amber-700 tracking-wide">
                        CERTIFICATE
                    </h2>
                    <p className="text-lg text-slate-600 mt-1">of {certificateType?.is_external ? 'Achievement' : 'Completion'}</p>
                </div>

                {/* Recipient Name */}
                <div className="my-4 py-3 px-12 border-y-2 border-amber-300">
                    <p className="text-sm text-slate-500 mb-1">This is to certify that</p>
                    <h3
                        className="text-4xl text-slate-900"
                        style={{ fontFamily: "'Great Vibes', cursive" }}
                    >
                        {certificate?.student_name || 'Student Name'}
                    </h3>
                </div>

                {/* Course/Certificate Info */}
                <div className="my-4">
                    <p className="text-base text-slate-600 mb-2">
                        has successfully completed the requirements for
                    </p>
                    <h4 className="text-2xl font-bold text-blue-800 mb-1">
                        {certificateType?.name || certificate?.course_name}
                    </h4>
                    {certificateType?.provider && (
                        <p className="text-sm text-slate-500">
                            Certified by: {certificateType.provider}
                        </p>
                    )}
                </div>

                {/* Grade/Score Display */}
                {certificate?.grade && !certificateType?.is_external && (
                    <div className="my-3 px-8 py-2 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-full border border-amber-300">
                        <span className="text-lg font-semibold" style={{ color: gradeInfo.color }}>
                            Grade: {gradeInfo.labelVi}
                        </span>
                    </div>
                )}

                {/* External Score (IELTS, TOEIC style) */}
                {certificateType?.is_external && scoreConfig.type && (
                    <div className="my-4 p-4 bg-white/50 rounded-lg border border-amber-200">
                        {scoreConfig.type === 'band' && (
                            <>
                                <p className="text-2xl font-bold text-blue-700 mb-2">
                                    Overall Band Score: {scores.overall || '-'}
                                </p>
                                <div className="flex justify-center gap-6 text-sm">
                                    {scoreConfig.sub_scores?.map(key => (
                                        <span key={key} className="text-slate-600">
                                            {scoreConfig.labels?.[key]}: <strong className="text-slate-800">{scores[key] || '-'}</strong>
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                        {scoreConfig.type === 'numeric' && (
                            <>
                                <p className="text-2xl font-bold text-blue-700 mb-2">
                                    {scoreConfig.total_label || 'Score'}: {scores.total || scores.score || '-'}
                                </p>
                                {scoreConfig.sub_scores && (
                                    <div className="flex justify-center gap-6 text-sm">
                                        {scoreConfig.sub_scores.map(key => (
                                            <span key={key} className="text-slate-600">
                                                {scoreConfig.labels?.[key]}: <strong>{scores[key] || '-'}</strong>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Certificate Details */}
                <div className="mt-4 flex items-center gap-12 text-sm text-slate-600">
                    <div>
                        <p className="text-xs text-slate-400">Certificate No.</p>
                        <p className="font-mono font-semibold text-slate-700">
                            {certificate?.certificate_number}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Completion Date</p>
                        <p className="font-semibold text-slate-700">
                            {formatDateEnglish(certificate?.completion_date)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Issue Date</p>
                        <p className="font-semibold text-slate-700">
                            {formatDateEnglish(certificate?.issued_at)}
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-6 w-full flex justify-between px-20">
                    <div className="text-center">
                        <div className="h-12 w-40 border-b-2 border-slate-400 mb-1" />
                        <p className="text-sm font-semibold text-slate-700">Center Director</p>
                        <p className="text-xs text-slate-500">Authorized Signature</p>
                    </div>

                    {/* Seal */}
                    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
                        <OfficialSeal text="OFFICIAL" color="#d4af37" size={80} />
                    </div>

                    <div className="text-center">
                        <div className="h-12 w-40 border-b-2 border-slate-400 mb-1" />
                        <p className="text-sm font-semibold text-slate-700">Academic Director</p>
                        <p className="text-xs text-slate-500">Authorized Signature</p>
                    </div>
                </div>
            </div>

            {/* QR Code for Verification */}
            <div className="absolute bottom-8 right-8 text-center">
                <QRCodePlaceholder value={certificate?.certificate_number} size={60} />
                <p className="text-xs text-slate-400 mt-1">Scan to verify</p>
            </div>
        </div>
    );
};

// ============================================================
// TEMPLATE 2: MODERN BLUE (Tin học)
// ============================================================
export const ModernBlueTemplate = ({ certificate, certificateType, centerInfo }) => {
    const gradeInfo = getGradeInfo(certificate?.grade);
    const scores = certificate?.scores || {};
    const scoreConfig = certificateType?.score_config || {};

    return (
        <div
            className="relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6 overflow-hidden"
            style={{
                width: '297mm',
                height: '210mm',
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* Tech Pattern Background */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-full"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 50px,
                            rgba(59, 130, 246, 0.3) 50px,
                            rgba(59, 130, 246, 0.3) 51px
                        ),
                        repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 50px,
                            rgba(59, 130, 246, 0.3) 50px,
                            rgba(59, 130, 246, 0.3) 51px
                        )`
                    }}
                />
            </div>

            {/* Modern Border */}
            <div className="absolute inset-4 border-4 border-blue-500/30 rounded-2xl" />
            <div className="absolute top-4 left-4 w-20 h-20 border-l-4 border-t-4 border-blue-600 rounded-tl-2xl" />
            <div className="absolute top-4 right-4 w-20 h-20 border-r-4 border-t-4 border-blue-600 rounded-tr-2xl" />
            <div className="absolute bottom-4 left-4 w-20 h-20 border-l-4 border-b-4 border-blue-600 rounded-bl-2xl" />
            <div className="absolute bottom-4 right-4 w-20 h-20 border-r-4 border-b-4 border-blue-600 rounded-br-2xl" />

            {/* Decorative Circles */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400/10 rounded-full" />
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-cyan-400/10 rounded-full" />

            {/* Content Container */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
                {/* Header with Logo */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-xl font-bold text-blue-800 tracking-wide">
                            {centerInfo?.name || 'SKILL MASTER'}
                        </h1>
                        <p className="text-xs text-blue-500">
                            Digital Skills Training Center
                        </p>
                    </div>
                </div>

                {/* Certificate Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400" />
                    <span className="px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full tracking-wider">
                        CERTIFICATE
                    </span>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400" />
                </div>

                {/* Certificate Type */}
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {certificateType?.name || certificate?.course_name}
                </h2>
                {certificateType?.provider && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <Shield className="h-4 w-4" />
                        <span>Certified by {certificateType.provider}</span>
                    </div>
                )}

                {/* Recipient */}
                <div className="my-4">
                    <p className="text-sm text-slate-500 mb-2">This certifies that</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-wide"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        {certificate?.student_name || 'Student Name'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">
                        has successfully completed all requirements
                    </p>
                </div>

                {/* Score/Grade Display */}
                <div className="my-4 flex items-center gap-6">
                    {certificate?.grade && !certificateType?.is_external && (
                        <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
                            <p className="text-xs opacity-80">Achievement Level</p>
                            <p className="text-xl font-bold">{gradeInfo.labelVi}</p>
                        </div>
                    )}

                    {certificateType?.is_external && scoreConfig.type === 'numeric' && (
                        <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
                            <p className="text-xs opacity-80">{scoreConfig.total_label || 'Score'}</p>
                            <p className="text-3xl font-bold">{scores.total || scores.score || '-'}</p>
                            {scoreConfig.pass_score && (
                                <p className="text-xs opacity-70">Pass: {scoreConfig.pass_score}+</p>
                            )}
                        </div>
                    )}

                    {scoreConfig.sub_scores && (
                        <div className="flex gap-3">
                            {scoreConfig.sub_scores.map(key => (
                                <div key={key} className="px-4 py-2 bg-white rounded-lg shadow border border-blue-100">
                                    <p className="text-xs text-slate-500">{scoreConfig.labels?.[key]}</p>
                                    <p className="text-lg font-bold text-blue-700">{scores[key] || '-'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Certificate Info Row */}
                <div className="mt-4 flex items-center gap-8 py-3 px-6 bg-white/60 rounded-xl backdrop-blur border border-blue-100">
                    <div className="text-center">
                        <p className="text-xs text-slate-400">Certificate ID</p>
                        <p className="text-sm font-mono font-semibold text-slate-700">
                            {certificate?.certificate_number}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-blue-200" />
                    <div className="text-center">
                        <p className="text-xs text-slate-400">Completion Date</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {formatDate(certificate?.completion_date)}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-blue-200" />
                    <div className="text-center">
                        <p className="text-xs text-slate-400">Issued</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {formatDate(certificate?.issued_at)}
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-8 w-full flex justify-between px-24">
                    <div className="text-center">
                        <div className="h-10 w-36 border-b-2 border-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-700">Center Director</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="p-2 bg-blue-50 rounded-full mb-1">
                            <CheckCircle className="h-10 w-10 text-blue-500" />
                        </div>
                        <p className="text-xs text-blue-500 font-medium">VERIFIED</p>
                    </div>

                    <div className="text-center">
                        <div className="h-10 w-36 border-b-2 border-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-700">Program Manager</p>
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div className="absolute bottom-6 right-6">
                <QRCodePlaceholder value={certificate?.certificate_number} size={60} />
            </div>
        </div>
    );
};

// ============================================================
// TEMPLATE 3: PROFESSIONAL PURPLE (Lập trình)
// ============================================================
export const ProfessionalPurpleTemplate = ({ certificate, certificateType, centerInfo }) => {
    const gradeInfo = getGradeInfo(certificate?.grade);

    return (
        <div
            className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 overflow-hidden"
            style={{
                width: '297mm',
                height: '210mm',
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* Code Pattern Background */}
            <div className="absolute inset-0 opacity-5 font-mono text-xs text-purple-900 leading-tight overflow-hidden">
                {`const certificate = { student: "${certificate?.student_name}", course: "${certificateType?.name}", grade: "${certificate?.grade}", certified: true }; 
                function verifyCertificate(id) { return database.find(id).isValid; } 
                class Achievement { constructor() { this.verified = true; } } `.repeat(50)}
            </div>

            {/* Border */}
            <div className="absolute inset-3 border-[6px] border-purple-600/40 rounded-xl" />
            <div className="absolute inset-5 border-2 border-purple-400/30 rounded-lg" />

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-400/20 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-violet-400/20 to-transparent rounded-tr-full" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg">
                        <Code className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-lg font-bold text-purple-800">
                            {centerInfo?.name || 'SKILL MASTER'}
                        </h1>
                        <p className="text-xs text-purple-500">Programming & Technology</p>
                    </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                    <span className="inline-block px-4 py-1 bg-purple-600 text-white text-sm font-medium rounded-md mb-3">
                        CERTIFICATE OF COMPLETION
                    </span>
                    <h2 className="text-3xl font-bold text-slate-800">
                        {certificateType?.name || certificate?.course_name}
                    </h2>
                </div>

                {/* Recipient */}
                <div className="my-6">
                    <p className="text-sm text-slate-500 mb-2">Awarded to</p>
                    <h3 className="text-4xl font-bold text-purple-900"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                        {certificate?.student_name}
                    </h3>
                </div>

                {/* Grade */}
                {certificate?.grade && (
                    <div className="my-4 px-8 py-3 bg-white/70 rounded-xl border border-purple-200 shadow-sm">
                        <p className="text-sm text-slate-500">Achievement Level</p>
                        <p className="text-2xl font-bold" style={{ color: gradeInfo.color }}>
                            {gradeInfo.labelVi}
                        </p>
                    </div>
                )}

                {/* Details */}
                <div className="mt-4 grid grid-cols-3 gap-8 text-sm">
                    <div className="p-3 bg-white/50 rounded-lg">
                        <p className="text-xs text-slate-400">Certificate ID</p>
                        <p className="font-mono font-semibold text-slate-700">
                            {certificate?.certificate_number}
                        </p>
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg">
                        <p className="text-xs text-slate-400">Completed</p>
                        <p className="font-semibold text-slate-700">
                            {formatDate(certificate?.completion_date)}
                        </p>
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg">
                        <p className="text-xs text-slate-400">Issued</p>
                        <p className="font-semibold text-slate-700">
                            {formatDate(certificate?.issued_at)}
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-8 w-full flex justify-between items-end px-20">
                    <div className="text-center">
                        <div className="h-10 w-32 border-b-2 border-purple-300" />
                        <p className="text-sm text-slate-600 mt-1">Instructor</p>
                    </div>

                    <OfficialSeal text="VERIFIED" color="#7c3aed" size={70} />

                    <div className="text-center">
                        <div className="h-10 w-32 border-b-2 border-purple-300" />
                        <p className="text-sm text-slate-600 mt-1">Director</p>
                    </div>
                </div>
            </div>

            {/* QR */}
            <div className="absolute bottom-5 right-5">
                <QRCodePlaceholder value={certificate?.certificate_number} size={55} />
            </div>
        </div>
    );
};

// ============================================================
// TEMPLATE 4: ELEGANT WARM (Kỹ năng mềm)
// ============================================================
export const ElegantWarmTemplate = ({ certificate, certificateType, centerInfo }) => {
    const gradeInfo = getGradeInfo(certificate?.grade);

    return (
        <div
            className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6"
            style={{
                width: '297mm',
                height: '210mm',
                fontFamily: "'Lora', serif"
            }}
        >
            {/* Decorative Border */}
            <div className="absolute inset-4 border-[6px] border-orange-400/50 rounded-2xl" />
            <div className="absolute inset-6 border-2 border-orange-300/40 rounded-xl" />

            {/* Floral corners (simplified) */}
            <svg className="absolute top-6 left-6 w-16 h-16 text-orange-400/60" viewBox="0 0 100 100">
                <circle cx="20" cy="20" r="8" fill="currentColor" />
                <circle cx="35" cy="10" r="5" fill="currentColor" opacity="0.7" />
                <circle cx="10" cy="35" r="5" fill="currentColor" opacity="0.7" />
            </svg>
            <svg className="absolute top-6 right-6 w-16 h-16 text-orange-400/60 rotate-90" viewBox="0 0 100 100">
                <circle cx="20" cy="20" r="8" fill="currentColor" />
                <circle cx="35" cy="10" r="5" fill="currentColor" opacity="0.7" />
                <circle cx="10" cy="35" r="5" fill="currentColor" opacity="0.7" />
            </svg>
            <svg className="absolute bottom-6 left-6 w-16 h-16 text-orange-400/60 -rotate-90" viewBox="0 0 100 100">
                <circle cx="20" cy="20" r="8" fill="currentColor" />
                <circle cx="35" cy="10" r="5" fill="currentColor" opacity="0.7" />
                <circle cx="10" cy="35" r="5" fill="currentColor" opacity="0.7" />
            </svg>
            <svg className="absolute bottom-6 right-6 w-16 h-16 text-orange-400/60 rotate-180" viewBox="0 0 100 100">
                <circle cx="20" cy="20" r="8" fill="currentColor" />
                <circle cx="35" cy="10" r="5" fill="currentColor" opacity="0.7" />
                <circle cx="10" cy="35" r="5" fill="currentColor" opacity="0.7" />
            </svg>

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg ring-4 ring-orange-200">
                        <Users className="h-8 w-8 text-white" />
                    </div>
                </div>

                <h1 className="text-xl font-semibold text-orange-800 tracking-widest uppercase mb-1">
                    {centerInfo?.name || 'SKILL MASTER'}
                </h1>
                <p className="text-sm text-orange-500 mb-6">Soft Skills Development Center</p>

                {/* Certificate Title */}
                <div className="mb-4">
                    <h2 className="text-lg text-slate-600 italic">Certificate of Achievement</h2>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">
                        {certificateType?.name || certificate?.course_name}
                    </h3>
                </div>

                {/* Recipient */}
                <div className="my-6 py-4 px-12 border-y-2 border-orange-300/50">
                    <p className="text-sm text-slate-500 mb-2">This is to certify that</p>
                    <h4
                        className="text-4xl text-slate-900"
                        style={{ fontFamily: "'Satisfy', cursive" }}
                    >
                        {certificate?.student_name}
                    </h4>
                </div>

                {/* Description */}
                <p className="text-base text-slate-600 max-w-xl mb-4">
                    has demonstrated exceptional commitment and successfully completed
                    the course requirements, showing remarkable growth in personal development.
                </p>

                {/* Grade */}
                {certificate?.grade && (
                    <div className="my-3 px-6 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full border border-orange-200">
                        <span className="text-lg font-semibold" style={{ color: gradeInfo.color }}>
                            ★ {gradeInfo.labelVi} ★
                        </span>
                    </div>
                )}

                {/* Details */}
                <div className="mt-4 flex gap-10 text-sm text-slate-600">
                    <div>
                        <p className="text-xs text-slate-400">Certificate No.</p>
                        <p className="font-semibold">{certificate?.certificate_number}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Date</p>
                        <p className="font-semibold">{formatDate(certificate?.issued_at)}</p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-8 w-full flex justify-between items-center px-16">
                    <div className="text-center">
                        <div className="h-10 w-32 border-b-2 border-orange-300" />
                        <p className="text-sm text-slate-600 mt-1">Trainer</p>
                    </div>

                    <OfficialSeal text="CERTIFIED" color="#ea580c" size={70} />

                    <div className="text-center">
                        <div className="h-10 w-32 border-b-2 border-orange-300" />
                        <p className="text-sm text-slate-600 mt-1">Director</p>
                    </div>
                </div>
            </div>

            {/* QR */}
            <div className="absolute bottom-5 right-5">
                <QRCodePlaceholder value={certificate?.certificate_number} size={50} />
            </div>
        </div>
    );
};

// ============================================================
// TEMPLATE SELECTOR
// ============================================================
export const CertificateTemplate = ({
    certificate,
    certificateType,
    centerInfo,
    template = 'auto' // 'auto', 'classic-gold', 'modern-blue', 'professional-purple', 'elegant-warm'
}) => {
    // Auto-select template based on category
    const getAutoTemplate = () => {
        const category = certificateType?.category;
        switch (category) {
            case 'language':
                return 'classic-gold';
            case 'office':
                return 'modern-blue';
            case 'programming':
                return 'professional-purple';
            case 'soft_skill':
                return 'elegant-warm';
            default:
                return 'classic-gold';
        }
    };

    const selectedTemplate = template === 'auto' ? getAutoTemplate() : template;

    const templates = {
        'classic-gold': ClassicGoldTemplate,
        'modern-blue': ModernBlueTemplate,
        'professional-purple': ProfessionalPurpleTemplate,
        'elegant-warm': ElegantWarmTemplate,
    };

    const TemplateComponent = templates[selectedTemplate] || ClassicGoldTemplate;

    return (
        <TemplateComponent
            certificate={certificate}
            certificateType={certificateType}
            centerInfo={centerInfo}
        />
    );
};

// Export all templates
export default {
    CertificateTemplate,
    ClassicGoldTemplate,
    ModernBlueTemplate,
    ProfessionalPurpleTemplate,
    ElegantWarmTemplate,
};

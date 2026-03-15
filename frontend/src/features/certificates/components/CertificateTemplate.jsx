import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATE_CONFIG, CATEGORY_CONFIG } from '../constants';
import { formatCertificateDateVN } from '../utils/pdf-utils';
import { cn } from '@/lib/utils';

/**
 * Professional Certificate Template
 * Premium design with ornamental borders, seal, signature, QR verification
 */
export default function CertificateTemplate({
  studentName,
  typeName,
  grade,
  certificateNumber,
  issueDate,
  centerName = 'SKILL MASTER',
  centerSubtitle = 'TRUNG TÂM ĐÀO TẠO',
  category,
  showQR = true,
  showSerial = true,
  className,
}) {
  const template = CATEGORY_CONFIG[category]?.template || 'classic-gold';
  const templateConf = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG['classic-gold'];
  const primaryColor = templateConf.previewColor;
  
  const verifyUrl = `${window.location.origin}/verify-certificate?cert=${certificateNumber}`;
  const displayDate = issueDate ? new Date(issueDate) : new Date();

  // Grade English mapping
  const GRADE_EN = {
    'Xuất sắc': 'Distinction',
    'Giỏi': 'Merit', 
    'Khá': 'Credit',
    'Đạt': 'Pass'
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div 
        className="w-full bg-[#FFFDF7] relative overflow-hidden"
        style={{ 
          aspectRatio: '1.414 / 1',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Background watermark pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${primaryColor} 0px, ${primaryColor} 1px, transparent 1px, transparent 30px), repeating-linear-gradient(-45deg, ${primaryColor} 0px, ${primaryColor} 1px, transparent 1px, transparent 30px)`,
          }}
        />

        {/* ═══ OUTER DECORATIVE BORDER ═══ */}
        <div className="absolute inset-3 sm:inset-4 md:inset-5 pointer-events-none"
          style={{ border: `3px solid ${primaryColor}30` }}
        />
        
        {/* ═══ INNER ORNAMENTAL BORDER (double line) ═══ */}
        <div className="absolute inset-5 sm:inset-6 md:inset-8 pointer-events-none"
          style={{ border: `2px double ${primaryColor}50` }}
        />

        {/* ═══ CORNER FLOURISHES ═══ */}
        {[
          'top-4 left-4 sm:top-5 sm:left-5 md:top-7 md:left-7',
          'top-4 right-4 sm:top-5 sm:right-5 md:top-7 md:right-7 -scale-x-100',
          'bottom-4 left-4 sm:bottom-5 sm:left-5 md:bottom-7 md:left-7 -scale-y-100',
          'bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-7 md:right-7 -scale-x-100 -scale-y-100',
        ].map((pos, i) => (
          <div key={i} className={cn("absolute w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 pointer-events-none", pos)}>
            <svg viewBox="0 0 60 60" fill="none" className="w-full h-full" style={{ color: primaryColor }}>
              <path d="M2 2 C2 2, 2 30, 2 58" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
              <path d="M2 2 C2 2, 30 2, 58 2" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
              <path d="M2 2 C12 2, 18 8, 18 18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
              <path d="M2 2 C2 12, 8 18, 18 18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
              <circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.3"/>
              <path d="M4 12 C8 12, 12 8, 12 4" stroke="currentColor" strokeWidth="1" opacity="0.25"/>
            </svg>
          </div>
        ))}

        {/* ═══ CERTIFICATE CONTENT ═══ */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-8 py-8 sm:px-12 sm:py-10 md:px-20 md:py-12 text-center">
          
          {/* ── HEADER: Logo + Center Name ── */}
          <div className="flex flex-col items-center gap-1">
            {/* SM Monogram / Logo Area */}
            <div className="relative">
              <div 
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2"
                style={{ 
                  borderColor: `${primaryColor}60`,
                  background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)`,
                }}
              >
                <span 
                  className="text-xl sm:text-2xl md:text-3xl font-bold font-serif tracking-wider"
                  style={{ color: primaryColor }}
                >
                  SM
                </span>
              </div>
            </div>
            <div className="mt-1 sm:mt-2">
              <p className="text-[8px] sm:text-[9px] md:text-xs font-medium uppercase tracking-[0.3em] text-gray-400">
                {centerSubtitle}
              </p>
              <h2 
                className="text-sm sm:text-lg md:text-2xl font-bold uppercase tracking-[0.15em] font-serif"
                style={{ color: primaryColor }}
              >
                {centerName}
              </h2>
            </div>
          </div>

          {/* ── TITLE ── */}
          <div className="mt-2 sm:mt-4 md:mt-6">
            <div className="flex items-center gap-3 sm:gap-4 justify-center mb-1 sm:mb-2">
              <div className="h-px w-8 sm:w-12 md:w-20" style={{ background: `linear-gradient(to right, transparent, ${primaryColor}60)` }} />
              <h1 
                className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold uppercase tracking-[0.15em]"
                style={{ color: primaryColor }}
              >
                Chứng Nhận
              </h1>
              <div className="h-px w-8 sm:w-12 md:w-20" style={{ background: `linear-gradient(to left, transparent, ${primaryColor}60)` }} />
            </div>
            <p className="text-[8px] sm:text-xs md:text-sm uppercase tracking-[0.4em] text-gray-400 font-medium">
              Certificate of Completion
            </p>
          </div>

          {/* ── BODY: Student Name + Course ── */}
          <div className="mt-3 sm:mt-5 md:mt-8 max-w-2xl w-full space-y-3 sm:space-y-4 md:space-y-6">
            <p className="text-[9px] sm:text-xs md:text-sm text-gray-500 font-serif italic">
              Chứng nhận rằng / This is to certify that
            </p>
            
            {/* Student Name */}
            <div className="relative py-1 sm:py-2">
              <h3 
                className="text-xl sm:text-3xl md:text-5xl font-bold capitalize" 
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: '#1a1a2e' }}
              >
                {studentName}
              </h3>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/5 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${primaryColor}50, transparent)` }}
              />
            </div>

            <p className="text-[9px] sm:text-xs md:text-sm text-gray-500 font-serif italic">
              Đã hoàn thành xuất sắc khóa đào tạo / Has successfully completed
            </p>

            {/* Course Name */}
            <h4 
              className="text-base sm:text-xl md:text-3xl font-bold uppercase tracking-wide font-serif px-4 leading-tight"
              style={{ color: '#1a1a2e' }}
            >
              {typeName}
            </h4>
          </div>

          {/* ── GRADE SEAL (if applicable) ── */}
          {grade && (
            <div className="mt-2 sm:mt-4 md:mt-6">
              <div className="relative inline-flex flex-col items-center">
                {/* Decorative ring */}
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center border-[3px] sm:border-4 relative"
                  style={{ 
                    borderColor: `${primaryColor}50`,
                    borderStyle: 'double',
                    background: `radial-gradient(circle, ${primaryColor}05, transparent)`,
                  }}
                >
                  {/* Inner ring */}
                  <div 
                    className="absolute inset-1 sm:inset-1.5 md:inset-2 rounded-full border"
                    style={{ borderColor: `${primaryColor}25` }}
                  />
                  <span className="text-[7px] sm:text-[8px] md:text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                    Xếp loại
                  </span>
                  <span className="text-sm sm:text-lg md:text-2xl font-black text-gray-900 leading-tight">
                    {grade}
                  </span>
                  <span className="text-[6px] sm:text-[7px] md:text-[9px] font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
                    {GRADE_EN[grade] || ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── FOOTER: Date, QR, Signature ── */}
          <div className="flex justify-between items-end w-full mt-auto pt-4 sm:pt-6 md:pt-10">
            
            {/* Left: QR + Serial */}
            <div className="flex flex-col items-center gap-1 w-24 sm:w-32 md:w-44">
              {showQR && certificateNumber && (
                <div className="bg-white border border-gray-200 rounded p-1 sm:p-1.5 shadow-sm">
                  <QRCodeSVG
                    value={verifyUrl}
                    size={40}
                    level="M"
                    includeMargin={false}
                    bgColor="transparent"
                  />
                </div>
              )}
              {showSerial && certificateNumber && (
                <p className="font-mono text-[7px] sm:text-[8px] md:text-xs text-gray-400 font-medium tracking-wider mt-1">
                  No. {certificateNumber}
                </p>
              )}
            </div>

            {/* Center: Issue Date */}
            <div className="flex flex-col items-center w-28 sm:w-36 md:w-48">
              <p className="text-[9px] sm:text-xs md:text-sm text-gray-600 font-serif italic mb-2 sm:mb-4 md:mb-6">
                {formatCertificateDateVN(displayDate)}
              </p>
              <div className="w-full border-b-2 border-gray-700 mb-1 sm:mb-2" />
              <p className="text-[8px] sm:text-[9px] md:text-xs font-bold text-gray-800 uppercase tracking-[0.15em]">
                Giám Đốc Trung Tâm
              </p>
              <p className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                Center Director
              </p>
            </div>

            {/* Right: Second signature (optional, adds formality) */}
            <div className="flex flex-col items-center w-24 sm:w-32 md:w-44">
              <div className="w-full border-b-2 border-gray-700 mb-1 sm:mb-2" />
              <p className="text-[8px] sm:text-[9px] md:text-xs font-bold text-gray-800 uppercase tracking-[0.15em]">
                Trưởng Phòng Đào Tạo
              </p>
              <p className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                Head of Training
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

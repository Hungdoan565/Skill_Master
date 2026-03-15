import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { gooeyToast } from 'goey-toast';
import { QRCodeSVG } from 'qrcode.react';

const CATEGORY_STYLES = {
  language: { color: '#D97706', label: 'Ngoại ngữ' },
  office: { color: '#3B82F6', label: 'Tin học' },
  programming: { color: '#8B5CF6', label: 'Lập trình' },
  soft_skill: { color: '#F59E0B', label: 'Kỹ năng mềm' },
  other: { color: '#6B7280', label: 'Khác' }
};

const GRADE_MAPPING = {
  'Xuất sắc': 'Distinction',
  'Giỏi': 'Merit',
  'Khá': 'Credit',
  'Đạt': 'Pass'
};

export default function CertificatePrintModal({ certificate, open, onOpenChange }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!certificate) return null;

  const categoryKey = certificate.certificate_type?.category || certificate.category || 'other';
  const style = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.other;
  const primaryColor = style.color;
  const gradeEn = GRADE_MAPPING[certificate.grade] || '';
  const certNumber = certificate.certificate_number || certificate.certificate_code || '';
  const verifyUrl = `${window.location.origin}/verify-certificate?cert=${certNumber}`;
  const courseName = certificate.certificate_type?.name || certificate.course_name || 'Khóa học';

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const generatePDFPromise = (async () => {
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;

        const element = document.getElementById('certificate-print-area');
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFDF7'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`ChungNhan_${certificate.student_name}_${certNumber}.pdf`);
      })();

      await gooeyToast.promise(generatePDFPromise, {
        loading: 'Đang tạo PDF...',
        success: 'Đã tạo PDF thành công!',
        error: 'Lỗi khi tạo PDF'
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 flex flex-col bg-white border-0 shadow-2xl overflow-hidden max-h-[95vh]">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b shrink-0 print:hidden z-10 relative">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">In & Tải Chứng nhận</h2>
            <p className="text-sm text-slate-500">Mã: {certNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              In
            </Button>
            <Button 
              className="text-white hover:opacity-90"
              onClick={handleDownload}
              disabled={isDownloading}
              style={{ backgroundColor: primaryColor }}
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Đang tạo...' : 'Tải PDF'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Certificate Preview Container */}
        <div className="p-4 md:p-8 overflow-y-auto bg-slate-200/50 flex justify-center print:p-0 print:bg-white flex-1 min-h-0">
          
          {/* ═══════════ PRINT AREA ═══════════ */}
          <div 
            id="certificate-print-area"
            className="relative w-full max-w-[1000px] bg-[#FFFDF7] text-slate-900 shadow-xl print:shadow-none shrink-0 overflow-hidden"
            style={{ aspectRatio: '1.414 / 1' }}
          >
            {/* Subtle watermark pattern */}
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${primaryColor} 0px, ${primaryColor} 1px, transparent 1px, transparent 30px), repeating-linear-gradient(-45deg, ${primaryColor} 0px, ${primaryColor} 1px, transparent 1px, transparent 30px)`,
              }}
            />

            {/* Outer border */}
            <div className="absolute inset-4 sm:inset-5 md:inset-6 pointer-events-none"
              style={{ border: `3px solid ${primaryColor}30` }}
            />
            
            {/* Inner ornamental border */}
            <div className="absolute inset-6 sm:inset-7 md:inset-9 pointer-events-none"
              style={{ border: `2px double ${primaryColor}50` }}
            />

            {/* Corner flourishes */}
            {[
              'top-5 left-5 md:top-7 md:left-7',
              'top-5 right-5 md:top-7 md:right-7 -scale-x-100',
              'bottom-5 left-5 md:bottom-7 md:left-7 -scale-y-100',
              'bottom-5 right-5 md:bottom-7 md:right-7 -scale-x-100 -scale-y-100',
            ].map((pos, i) => (
              <div key={i} className={cn("absolute w-12 h-12 md:w-16 md:h-16 pointer-events-none", pos)}>
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
            <div className="relative z-10 flex flex-col items-center justify-between h-full px-12 py-10 md:px-24 md:py-14 text-center">
              
              {/* ── HEADER ── */}
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2"
                  style={{ 
                    borderColor: `${primaryColor}60`,
                    background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)`,
                  }}
                >
                  <span className="text-2xl md:text-3xl font-bold font-serif tracking-wider" style={{ color: primaryColor }}>
                    SM
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-[9px] md:text-xs font-medium uppercase tracking-[0.3em] text-gray-400">
                    Trung Tâm Đào Tạo
                  </p>
                  <h2 className="text-lg md:text-2xl font-bold uppercase tracking-[0.15em] font-serif" style={{ color: primaryColor }}>
                    Skill Master
                  </h2>
                </div>
              </div>

              {/* ── TITLE ── */}
              <div className="mt-4 md:mt-6">
                <div className="flex items-center gap-4 justify-center mb-1">
                  <div className="h-px w-12 md:w-20" style={{ background: `linear-gradient(to right, transparent, ${primaryColor}60)` }} />
                  <h1 className="text-3xl md:text-5xl font-serif font-bold uppercase tracking-[0.15em]" style={{ color: primaryColor }}>
                    Chứng Nhận
                  </h1>
                  <div className="h-px w-12 md:w-20" style={{ background: `linear-gradient(to left, transparent, ${primaryColor}60)` }} />
                </div>
                <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-gray-400 font-medium">
                  Certificate of Completion
                </p>
              </div>

              {/* ── BODY ── */}
              <div className="mt-5 md:mt-8 max-w-2xl w-full space-y-4 md:space-y-6">
                <p className="text-xs md:text-sm text-gray-500 font-serif italic">
                  Chứng nhận rằng / This is to certify that
                </p>
                
                <div className="relative py-2">
                  <h3 className="text-3xl md:text-5xl font-bold capitalize" style={{ fontFamily: "'Georgia', serif", color: '#1a1a2e' }}>
                    {certificate.student_name}
                  </h3>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/5 h-px"
                    style={{ background: `linear-gradient(to right, transparent, ${primaryColor}50, transparent)` }}
                  />
                </div>

                <p className="text-xs md:text-sm text-gray-500 font-serif italic">
                  Đã hoàn thành xuất sắc khóa đào tạo / Has successfully completed
                </p>

                <h4 className="text-xl md:text-3xl font-bold uppercase tracking-wide font-serif px-8 leading-tight" style={{ color: '#1a1a2e' }}>
                  {courseName}
                </h4>
              </div>

              {/* ── GRADE SEAL ── */}
              {certificate.grade && (
                <div className="mt-4 md:mt-6">
                  <div 
                    className="w-20 h-20 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center border-4 relative"
                    style={{ 
                      borderColor: `${primaryColor}50`,
                      borderStyle: 'double',
                      background: `radial-gradient(circle, ${primaryColor}05, transparent)`,
                    }}
                  >
                    <div 
                      className="absolute inset-1.5 md:inset-2 rounded-full border"
                      style={{ borderColor: `${primaryColor}25` }}
                    />
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                      Xếp loại
                    </span>
                    <span className="text-lg md:text-2xl font-black text-gray-900 leading-tight">
                      {certificate.grade}
                    </span>
                    {gradeEn && (
                      <span className="text-[7px] md:text-[9px] font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
                        {gradeEn}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── FOOTER ── */}
              <div className="flex justify-between items-end w-full mt-auto pt-8 md:pt-12">
                
                {/* QR + Serial */}
                <div className="flex flex-col items-center gap-1 w-32 md:w-44">
                  {certNumber && (
                    <div className="bg-white border border-gray-200 rounded p-1.5 shadow-sm">
                      <QRCodeSVG
                        value={verifyUrl}
                        size={48}
                        level="M"
                        includeMargin={false}
                        bgColor="transparent"
                      />
                    </div>
                  )}
                  {certNumber && (
                    <p className="font-mono text-[8px] md:text-xs text-gray-400 font-medium tracking-wider mt-1">
                      No. {certNumber}
                    </p>
                  )}
                </div>

                {/* Issue Date + Director Signature */}
                <div className="flex flex-col items-center w-36 md:w-48">
                  <p className="text-xs md:text-sm text-gray-600 font-serif italic mb-4 md:mb-6">
                    {certificate.issued_at ? format(new Date(certificate.issued_at), 'dd/MM/yyyy') : '...'}
                  </p>
                  <div className="w-full border-b-2 border-gray-700 mb-2" />
                  <p className="text-[9px] md:text-xs font-bold text-gray-800 uppercase tracking-[0.15em]">
                    Giám Đốc Trung Tâm
                  </p>
                  <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    Center Director
                  </p>
                </div>

                {/* Head of Training Signature */}
                <div className="flex flex-col items-center w-32 md:w-44">
                  <div className="h-12 md:h-16" /> {/* Space for signature */}
                  <div className="w-full border-b-2 border-gray-700 mb-2" />
                  <p className="text-[9px] md:text-xs font-bold text-gray-800 uppercase tracking-[0.15em]">
                    Trưởng Phòng Đào Tạo
                  </p>
                  <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    Head of Training
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 landscape;
              margin: 0mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background: white !important;
            }
            body * {
              visibility: hidden;
            }
            #certificate-print-area, #certificate-print-area * {
              visibility: visible;
            }
            #certificate-print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              max-width: none !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              transform: none !important;
            }
          }
        `}} />
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, Award, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORY_STYLES = {
  language: { color: '#3B82F6', twColor: 'text-blue-600', twBorder: 'border-blue-600', twBg: 'bg-blue-600' },
  office: { color: '#10B981', twColor: 'text-emerald-600', twBorder: 'border-emerald-600', twBg: 'bg-emerald-600' },
  programming: { color: '#8B5CF6', twColor: 'text-purple-600', twBorder: 'border-purple-600', twBg: 'bg-purple-600' },
  soft_skill: { color: '#F59E0B', twColor: 'text-amber-600', twBorder: 'border-amber-600', twBg: 'bg-amber-600' },
  other: { color: '#6B7280', twColor: 'text-gray-600', twBorder: 'border-gray-600', twBg: 'bg-gray-600' }
};

const GRADE_MAPPING = {
  'Xuất sắc': 'DISTINCTION',
  'Giỏi': 'MERIT',
  'Khá': 'CREDIT',
  'Đạt': 'PASS'
};

export default function CertificatePrintModal({ certificate, open, onOpenChange }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!certificate) return null;

  const categoryKey = certificate.certificate_type?.category || certificate.category || 'other';
  const style = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.other;
  const gradeEn = GRADE_MAPPING[certificate.grade] || 'PASS';

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      toast.info("Đang tạo PDF...");
      
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = document.getElementById('certificate-print-area');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
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
      pdf.save(`ChungNhan_${certificate.student_name}_${certificate.certificate_number}.pdf`);
      
      toast.success("Đã tải PDF thành công");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Không thể tạo PDF. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 flex flex-col bg-white border-0 shadow-2xl overflow-hidden max-h-[95vh]">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b shrink-0 print:hidden z-10 relative">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">In & Tải Chứng nhận</h2>
            <p className="text-sm text-slate-500">Mã: {certificate.certificate_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              In / Print
            </Button>
            <Button 
              className={cn("text-white", style.twBg, "hover:opacity-90")}
              onClick={handleDownload}
              disabled={isDownloading}
              style={{ backgroundColor: style.color }}
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Đang tạo PDF...' : 'Tải PDF'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Certificate Container */}
        <div className="p-4 md:p-8 overflow-y-auto bg-slate-200/50 flex justify-center print:p-0 print:bg-white flex-1 min-h-0">
          
          {/* Print Area */}
          <div 
            id="certificate-print-area"
            className="relative w-full aspect-[1.414/1] max-w-[1000px] bg-white text-slate-900 shadow-xl print:shadow-none shrink-0 overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(circle at center, ${style.color}08 0%, transparent 60%)`
            }}
          >
            {/* Inner Border Layers */}
            <div className={cn("absolute inset-4 sm:inset-6 md:inset-8 border-[6px] border-double", style.twBorder, "opacity-30")} />
            <div className={cn("absolute inset-5 sm:inset-7 md:inset-9 border border-solid", style.twBorder, "opacity-20")} />
            
            {/* Corner Ornaments */}
            <div className={cn("absolute top-8 left-8 w-16 h-16 border-t-[3px] border-l-[3px] opacity-40", style.twBorder)} />
            <div className={cn("absolute top-8 right-8 w-16 h-16 border-t-[3px] border-r-[3px] opacity-40", style.twBorder)} />
            <div className={cn("absolute bottom-8 left-8 w-16 h-16 border-b-[3px] border-l-[3px] opacity-40", style.twBorder)} />
            <div className={cn("absolute bottom-8 right-8 w-16 h-16 border-b-[3px] border-r-[3px] opacity-40", style.twBorder)} />

            {/* Certificate Content Wrapper */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full pt-12 pb-10 px-10 md:pt-16 md:pb-14 md:px-24 text-center">
              
              {/* Header */}
              <div className="flex flex-col items-center gap-3">
                <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-opacity-10", style.twBg.replace('bg-', 'bg-').replace('600', '100'), style.twColor)}>
                  <Award className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className={cn("text-xl md:text-3xl font-bold tracking-[0.2em] uppercase font-serif", style.twColor)}>
                    Skill Master
                  </h2>
                  <p className="text-[10px] md:text-sm tracking-[0.3em] text-slate-400 uppercase font-medium">
                    Education Center
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1 md:space-y-2 mt-2 md:mt-6">
                <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-widest text-slate-800 uppercase">
                  Chứng Nhận
                </h1>
                <h3 className="text-lg md:text-2xl font-serif tracking-[0.4em] text-slate-400 uppercase">
                  Certificate
                </h3>
              </div>

              {/* Body */}
              <div className="space-y-4 md:space-y-8 mt-4 md:mt-8 max-w-2xl w-full">
                <p className="text-xs md:text-lg text-slate-500 italic font-serif">
                  Chứng nhận này được trao cho / This is to certify that
                </p>
                
                <h2 className={cn("text-3xl md:text-6xl font-bold capitalize", style.twColor)} style={{ fontFamily: 'Georgia, serif' }}>
                  {certificate.student_name}
                </h2>
                
                <div className="w-24 md:w-32 h-[1px] mx-auto bg-slate-300 my-4 md:my-8" />
                
                <p className="text-xs md:text-base text-slate-600 font-medium">
                  Đã hoàn thành xuất sắc khóa học / Has successfully completed the course
                </p>
                
                <h3 className="text-xl md:text-4xl font-bold text-slate-800 mt-2 px-4 md:px-8 font-serif leading-tight">
                  {certificate.certificate_type?.name || 'Khóa học'}
                </h3>
              </div>

              {/* Footer / Signatures */}
              <div className="flex justify-between items-end w-full mt-auto pt-6 md:pt-16 px-2 md:px-12">
                
                {/* Issue Date & Number */}
                <div className="flex flex-col items-center w-32 md:w-48">
                  <p className="text-sm md:text-lg font-semibold text-slate-800 border-b border-slate-300 pb-1 md:pb-2 mb-1 md:mb-2 w-full text-center">
                    {certificate.issued_at ? format(new Date(certificate.issued_at), 'dd/MM/yyyy') : '...'}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-medium">Ngày cấp / Date</p>
                  <p className="text-[8px] md:text-xs text-slate-400 mt-2 md:mt-4 font-mono tracking-wider">
                    SỐ/NO: {certificate.certificate_number}
                  </p>
                </div>

                {/* Center Badge / Seal */}
                <div className="relative flex items-center justify-center -translate-y-2 md:-translate-y-4">
                  <div className={cn("absolute inset-[-10px] md:inset-[-15px] rotate-45 border border-dashed opacity-30", style.twBorder)} />
                  <div className={cn("absolute inset-[-10px] md:inset-[-15px] rotate-[22.5deg] border border-dashed opacity-30", style.twBorder)} />
                  <div className={cn(
                    "w-24 h-24 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center border-[3px] md:border-4 border-double shadow-sm relative z-10 bg-white",
                    style.twBorder
                  )}>
                    <CheckCircle className={cn("w-5 h-5 md:w-8 md:h-8 mb-0.5 md:mb-1 opacity-80", style.twColor)} />
                    <p className={cn("text-[8px] md:text-xs font-bold uppercase tracking-widest opacity-80", style.twColor)}>
                      Xếp loại
                    </p>
                    <p className="text-base md:text-2xl font-black text-slate-800 md:mt-1 uppercase tracking-wide">
                      {certificate.grade}
                    </p>
                    <p className={cn("text-[8px] md:text-xs font-bold tracking-widest md:mt-1 opacity-80", style.twColor)}>
                      {gradeEn}
                    </p>
                  </div>
                </div>

                {/* Signature */}
                <div className="flex flex-col items-center w-32 md:w-48">
                  <div className="w-full h-12 md:h-16 relative flex items-center justify-center">
                    <div className="text-slate-800 opacity-40 font-serif italic text-xl md:text-4xl -rotate-6 select-none">
                      Skill Master
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-400 mt-1 md:mt-2 mb-1 md:mb-2" />
                  <p className="text-[10px] md:text-xs text-slate-800 uppercase tracking-widest font-bold">Giám Đốc / Director</p>
                  <p className="text-[8px] md:text-[10px] text-slate-500 mt-0.5 md:mt-1 uppercase tracking-wider">Skill Master Education</p>
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
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
            }
          }
        `}} />
      </DialogContent>
    </Dialog>
  );
}

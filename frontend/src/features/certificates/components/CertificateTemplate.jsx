import React from 'react';
import { Award } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATE_CONFIG, CATEGORY_CONFIG } from '../constants';
import { formatCertificateDateVN } from '../utils/pdf-utils';
import { cn } from '@/lib/utils';

export default function CertificateTemplate({
  studentName,
  typeName,
  grade,
  certificateNumber,
  issueDate,
  centerName = 'TRUNG TÂM ĐÀO TẠO SKILL MASTER',
  category,
  showQR = true,
  showSerial = true,
  className,
}) {
  const template = CATEGORY_CONFIG[category]?.template || 'classic-gold';
  const templateConf = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG['classic-gold'];
  
  const verifyUrl = `${window.location.origin}/verify/${certificateNumber}`;
  const displayDate = issueDate ? new Date(issueDate) : new Date();

  return (
    <div className={cn("relative group perspective-1000 w-full min-h-[400px] flex", className)}>
      <div 
        className="w-full bg-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-out"
        style={{ 
          border: `12px solid ${templateConf.previewColor}15`,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px ${templateConf.previewColor}20` 
        }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        
        <div 
          className="absolute inset-4 border-[3px] opacity-40 rounded-lg pointer-events-none"
          style={{ borderColor: templateConf.previewColor, borderStyle: 'double' }}
        />
        <div 
          className="absolute inset-6 border opacity-20 rounded-md pointer-events-none"
          style={{ borderColor: templateConf.previewColor }}
        />
        
        <div className="relative z-10 w-full max-w-lg mx-auto transform transition-all duration-300 group-hover:scale-[1.02]">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
              {centerName}
            </h2>
          </div>
          
          <h1 
            className="text-5xl font-serif font-bold mb-8 uppercase tracking-widest drop-shadow-sm"
            style={{ color: templateConf.previewColor }}
          >
            Chứng Chỉ
          </h1>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-widest">Chứng nhận học viên:</p>
              <h3 className="text-4xl font-bold text-gray-900 capitalize font-serif relative inline-block">
                {studentName}
                <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </h3>
            </div>
            
            <div className="pt-4">
              <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Đã hoàn thành xuất sắc khóa đào tạo:</p>
              <h4 className="text-xl font-bold text-gray-800 uppercase tracking-wide px-8">
                {typeName}
              </h4>
            </div>
          </div>
          
          {grade && (
            <div className="mt-8 inline-flex flex-col items-center">
              <div className="px-8 py-2.5 rounded-full font-bold text-lg border-2 shadow-sm bg-white"
                   style={{ borderColor: templateConf.previewColor, color: templateConf.previewColor }}>
                {grade}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-end w-full px-4 mt-12">
            <div className="text-left space-y-2">
              {showQR && certificateNumber && (
                <div className="w-16 h-16 bg-white border border-gray-200 rounded flex flex-col items-center justify-center p-1 shadow-sm">
                  <QRCodeSVG
                    value={verifyUrl}
                    size={48}
                    level="M"
                    includeMargin={false}
                    bgColor="transparent"
                  />
                  <span className="text-[6px] font-mono text-gray-500 mt-0.5">Xác thực</span>
                </div>
              )}
              {showSerial && certificateNumber && (
                <div className="font-mono text-xs text-gray-500 font-medium">No. {certificateNumber}</div>
              )}
            </div>
            
            <div className="text-center space-y-2 flex flex-col items-center">
              <div className="text-xs text-gray-500 font-serif italic mb-6">
                {formatCertificateDateVN(displayDate)}
              </div>
              <div className="w-40 border-b-2 border-gray-800" />
              <div className="text-[10px] font-bold text-gray-800 uppercase tracking-widest pt-1">Giám đốc trung tâm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { ChevronLeft, ChevronRight, Hash, Mail, Award, CheckCircle2, QrCode } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TEMPLATE_CONFIG } from '../../constants';
import { formatCertificateDateVN } from '../../utils/pdf-utils';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function StepPreviewAndConfirm({ form, selectedStudents, certificateType, centerInfo }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!certificateType || selectedStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-64 bg-card rounded-xl border border-border">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Đang tải dữ liệu xem trước...</p>
      </div>
    );
  }

  const student = selectedStudents[currentIndex];
  const templateConf = TEMPLATE_CONFIG[certificateType.template] || TEMPLATE_CONFIG['classic-gold'];
  const scores = form.watch(`scores.${student.student_id}`);
  
  const showQR = form.watch('showQR');
  const showSerial = form.watch('showSerial');

  const displayScore = () => {
    if (!scores) return 'Đang cập nhật...';
    if (certificateType.score_config?.type === 'grade') return scores.grade;
    if (certificateType.score_config?.type === 'band') return `Overall: ${scores.overall || 0}`;
    if (certificateType.score_config?.type === 'numeric') return `Điểm: ${scores.total || 0}`;
    return '';
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : selectedStudents.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < selectedStudents.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
        <div className="h-12 w-12 bg-card rounded-full flex items-center justify-center border border-amber-500/20 shadow-sm shrink-0 z-10">
          <CheckCircle2 className="w-6 h-6 text-amber-500" />
        </div>
        <div className="z-10 relative">
          <h4 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
            Xác nhận thông tin & Xem trước
          </h4>
          <p className="text-sm text-muted-foreground font-medium">
            Vui lòng kiểm tra lại thông tin trên chứng chỉ mẫu trước khi cấp phát chính thức.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* LEFT PANEL: Preview */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {currentIndex + 1}
              </span>
              <span className="text-sm font-semibold text-muted-foreground tracking-wide">
                Học viên <span className="text-foreground">{currentIndex + 1}</span> / {selectedStudents.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-card p-1 rounded-lg border border-border shadow-sm">
              <Button type="button" variant="outline" size="icon" className="w-8 h-8 rounded-md border-0 bg-transparent hover:bg-muted text-muted-foreground" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-border" />
              <Button type="button" variant="outline" size="icon" className="w-8 h-8 rounded-md border-0 bg-transparent hover:bg-muted text-muted-foreground" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* MOCK CERTIFICATE PREVIEW */}
          <div className="relative group perspective-1000 w-full flex-1 min-h-[400px]">
            <div 
              className="absolute inset-0 w-full bg-card rounded-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 ease-out"
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
                    {centerInfo?.name || 'TRUNG TÂM ĐÀO TẠO SKILL MASTER'}
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
                      {student.student_name}
                      <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    </h3>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Đã hoàn thành xuất sắc khóa đào tạo:</p>
                    <h4 className="text-xl font-bold text-gray-800 uppercase tracking-wide px-8">
                      {certificateType.name}
                    </h4>
                  </div>
                </div>
                
                <div className="mt-8 inline-flex flex-col items-center">
                  <div className="px-8 py-2.5 rounded-full font-bold text-lg border-2 shadow-sm bg-white"
                       style={{ borderColor: templateConf.previewColor, color: templateConf.previewColor }}>
                    {displayScore()}
                  </div>
                </div>
                
                <div className="flex justify-between items-end w-full px-4 mt-12">
                  <div className="text-left space-y-2">
                    {showQR && (
                      <div className="w-16 h-16 bg-white border border-gray-200 rounded flex flex-col items-center justify-center p-1 shadow-sm">
                        <QRCodeSVG
                          value={`https://skillmaster.vn/verify/SM-XXXX-XXXX`}
                          size={48}
                          level="M"
                          includeMargin={false}
                          bgColor="transparent"
                        />
                        <span className="text-[6px] font-mono text-gray-500 mt-0.5">Xác thực</span>
                      </div>
                    )}
                    {showSerial && <div className="font-mono text-xs text-gray-500 font-medium">No. SM-XXXX-XXXX</div>}
                  </div>
                  
                  <div className="text-center space-y-2 flex flex-col items-center">
                    <div className="text-xs text-gray-500 font-serif italic mb-6">
                      {formatCertificateDateVN(new Date())}
                    </div>
                    <div className="w-40 border-b-2 border-gray-800" />
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-widest pt-1">Giám đốc trung tâm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 flex-wrap max-h-12 overflow-hidden mt-4 bg-card border border-border rounded-full py-2 px-4 shadow-sm w-max mx-auto">
            {selectedStudents.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "group relative w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
                  idx === currentIndex ? "bg-primary scale-125 shadow-sm shadow-primary/30" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
                title={s.student_name}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {s.student_name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Settings */}
        <div className="space-y-6">
          <Card className="p-5 border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-foreground mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-3 bg-primary rounded-full" />
              Tùy chọn hiển thị
            </h4>
            <div className="space-y-3">
              <Controller
                control={form.control}
                name="showQR"
                render={({ field }) => (
                  <label 
                    htmlFor="showQR" 
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                      field.value ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", field.value ? "bg-primary" : "bg-transparent group-hover:bg-primary/30")} />
                    <div className="pt-0.5 relative z-10 pl-1">
                      <Checkbox 
                        id="showQR" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="font-semibold text-foreground flex items-center gap-2 mb-1">
                        <QrCode className="w-4 h-4 text-primary" />
                        Mã QR xác thực
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">Góc trái để quét xác thực chứng chỉ trực tuyến.</p>
                    </div>
                  </label>
                )}
              />

              <Controller
                control={form.control}
                name="showSerial"
                render={({ field }) => (
                  <label 
                    htmlFor="showSerial" 
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                      field.value ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", field.value ? "bg-primary" : "bg-transparent group-hover:bg-primary/30")} />
                    <div className="pt-0.5 relative z-10 pl-1">
                      <Checkbox 
                        id="showSerial" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="font-semibold text-foreground flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-indigo-500" />
                        Số Serial định danh
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">Mã duy nhất in trên mỗi chứng chỉ.</p>
                    </div>
                  </label>
                )}
              />
            </div>
          </Card>

          <Card className="p-5 border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-foreground mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-3 bg-emerald-500 rounded-full" />
              Thông báo & Tự động hóa
            </h4>
            <Controller
              control={form.control}
              name="sendEmail"
              render={({ field }) => (
                <label 
                  htmlFor="sendEmail" 
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                    field.value ? "bg-emerald-500/5 border-emerald-500 shadow-sm" : "bg-card border-border hover:border-emerald-500/50 hover:bg-muted"
                  )}
                >
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", field.value ? "bg-emerald-500" : "bg-transparent group-hover:bg-emerald-500/30")} />
                  <div className="pt-0.5 relative z-10 pl-1">
                    <Checkbox 
                      id="sendEmail" 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="font-semibold text-foreground flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      Gửi Email + File PDF
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Tự động gửi email thông báo và chứng chỉ PDF cho học viên sau khi duyệt.</p>
                  </div>
                </label>
              )}
            />
          </Card>

          <Card className="p-5 border-border bg-muted shadow-inner">
            <h4 className="font-bold text-foreground mb-3 text-sm">Tóm tắt yêu cầu cấp</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Tổng số học viên:</span>
                <span className="font-bold bg-card border border-border px-2 py-0.5 rounded text-foreground">{selectedStudents.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Hành động:</span>
                <span className="font-bold text-amber-500 flex items-center gap-1">
                  Cần Admin duyệt
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

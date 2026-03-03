import { format } from 'date-fns';
import { Printer, Link2, Share2, Ban, ExternalLink, Award, FileText, User, Calendar, CheckCircle, ShieldAlert, BookOpen, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_CONFIG, CATEGORY_CONFIG, GRADE_CONFIG, getCertificateDisplayStatus } from '../constants';
import { gooeyToast } from 'goey-toast';

const STATUS_STYLE_MAP = {
  issued: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  pending_approval: 'bg-primary/10 text-primary border-primary/20',
  expiring: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  expired: 'bg-muted text-muted-foreground border-border',
  revoked: 'bg-destructive/10 text-destructive border-destructive/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

function InfoRow({ label, icon: Icon, children, className = '' }) {
  return (
    <div className={`flex items-start justify-between py-3 border-b border-border/50 last:border-0 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground text-right max-w-[60%] break-words">
        {children}
      </div>
    </div>
  );
}

function renderScores(scores) {
  if (!scores || typeof scores !== 'object') return null;

  // For specific tests like IELTS/TOEIC
  if (scores.overall || scores.total || scores.band) {
    const mainScore = scores.overall || scores.total || scores.band;
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="text-right">
          <span className="text-lg font-bold text-primary">{mainScore}</span>
        </div>
        {Object.keys(scores).length > 1 && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            {Object.entries(scores)
              .filter(([k]) => !['overall', 'total', 'band'].includes(k))
              .map(([key, val]) => (
                <div key={key} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded text-xs">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-semibold">{val}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  // Generic flat scores
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {Object.entries(scores).map(([key, val]) => (
        <Badge key={key} variant="secondary" className="font-mono text-xs">
          {key}: {val}
        </Badge>
      ))}
    </div>
  );
}

export default function CertificateDetailSheet({ certificate, open, onOpenChange, onRevoke, onPrint }) {
  if (!certificate) return null;

  const displayStatus = getCertificateDisplayStatus(certificate);
  const statusInfo = STATUS_CONFIG[displayStatus];
  const catConfig = CATEGORY_CONFIG[certificate.certificate_type?.category || certificate.category] || CATEGORY_CONFIG.other;
  const isExternal = certificate.certificate_type?.is_external || certificate.is_external;
  const badgeStyle = STATUS_STYLE_MAP[displayStatus] || STATUS_STYLE_MAP.expired;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify-certificate?cert=${certificate.certificate_number}`;
    navigator.clipboard.writeText(url).then(() => {
      gooeyToast.success('Đã copy link xác minh');
    }).catch(() => {
      gooeyToast.error('Không thể copy link. Vui lòng copy thủ công.', {
        description: 'Trình duyệt không hỗ trợ copy tự động',
        action: {
          label: 'Copy thủ công',
          onClick: () => window.prompt('Sao chép liên kết xác minh:', url),
          successLabel: 'Đã chọn!'
        }
      });
    });
  };

  const handleRevoke = () => {
    onRevoke?.(certificate);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md md:max-w-lg overflow-y-auto p-0 border-border/50">
        {/* Hero Header */}
        <div className="relative pt-12 pb-6 px-6 bg-muted/30 border-b border-border/50 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10" />
          
          <SheetHeader className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-border/50 text-primary">
                <Award className="h-8 w-8" />
              </div>
              <Badge variant="outline" className={`px-2.5 py-1 text-xs border shadow-sm ${badgeStyle}`}>
                {statusInfo?.label || displayStatus}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mã chứng chỉ</p>
              <SheetTitle className="text-2xl font-mono tracking-tight text-foreground">
                {certificate.certificate_number || 'Chưa cấp mã'}
              </SheetTitle>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-primary" />
              Thông tin chung
            </h4>
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="px-4">
                <InfoRow label="Học viên" icon={User}>
                  <span className="font-semibold text-foreground">{certificate.student_name}</span>
                </InfoRow>
                <InfoRow label="Loại chứng chỉ" icon={BookOpen}>
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: catConfig.color }} />
                    <span>{certificate.certificate_type?.name || certificate.type_name}</span>
                  </div>
                </InfoRow>
                {certificate.grade && (
                  <InfoRow label="Xếp loại" icon={Award}>
                    <Badge variant="secondary" className="font-medium bg-muted">
                      {certificate.grade} {GRADE_CONFIG[certificate.grade] ? `(${GRADE_CONFIG[certificate.grade].en})` : ''}
                    </Badge>
                  </InfoRow>
                )}
                {certificate.scores && typeof certificate.scores === 'object' && (
                  <InfoRow label="Kết quả điểm" icon={CheckCircle} className="flex-col sm:flex-row sm:items-center">
                    {renderScores(certificate.scores)}
                  </InfoRow>
                )}
              </div>
            </div>
          </div>

          {/* Dates Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Thời gian
            </h4>
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="px-4">
                <InfoRow label="Ngày hoàn thành">
                  {certificate.completion_date ? format(new Date(certificate.completion_date), 'dd/MM/yyyy') : '—'}
                </InfoRow>
                <InfoRow label="Ngày cấp">
                  {certificate.issued_at ? format(new Date(certificate.issued_at), 'dd/MM/yyyy') : '—'}
                </InfoRow>
                {certificate.expires_at && (
                  <InfoRow label="Ngày hết hạn">
                    <span className={displayStatus === 'expiring' ? 'text-amber-500 font-medium' : displayStatus === 'expired' ? 'text-destructive font-medium line-through' : ''}>
                      {format(new Date(certificate.expires_at), 'dd/MM/yyyy')}
                    </span>
                  </InfoRow>
                )}
              </div>
            </div>
          </div>

          {/* External Info */}
          {isExternal && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Chứng chỉ ngoài hệ thống
              </h4>
              <div className="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden">
                <div className="px-4">
                  {certificate.external_id && (
                    <InfoRow label="Mã chứng chỉ gốc">
                      <code className="bg-white px-1.5 py-0.5 rounded text-xs border border-border/50">{certificate.external_id}</code>
                    </InfoRow>
                  )}
                  {certificate.exam_date && (
                    <InfoRow label="Ngày thi">{format(new Date(certificate.exam_date), 'dd/MM/yyyy')}</InfoRow>
                  )}
                  {certificate.external_verify_url && (
                    <InfoRow label="Link xác minh">
                      <a href={certificate.external_verify_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-end gap-1.5 font-medium transition-all hover:gap-2">
                        Xác minh ngay <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </InfoRow>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="h-px w-full bg-border/50 my-2" />

          {/* Actions */}
          <div className="space-y-4 pb-6">
            <h4 className="text-sm font-semibold text-foreground">Thao tác</h4>
            <div className="grid grid-cols-2 gap-3">
              {!isExternal && (
                <Button variant="outline" className="w-full bg-white hover:bg-muted border-border/50 shadow-sm" onClick={() => onPrint?.(certificate)}>
                  <Printer className="h-4 w-4 mr-2 text-muted-foreground" /> In / PDF
                </Button>
              )}
              <Button variant="outline" className="w-full bg-white hover:bg-muted border-border/50 shadow-sm" onClick={handleCopyLink}>
                <Link2 className="h-4 w-4 mr-2 text-muted-foreground" /> Copy link
              </Button>
              <Button variant="outline" className={`${isExternal ? 'col-span-2' : 'col-span-2'} w-full bg-white hover:bg-muted border-border/50 shadow-sm`} onClick={() => {
                const url = `${window.location.origin}/verify-certificate?cert=${certificate.certificate_number}`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
              }}>
                <Share2 className="h-4 w-4 mr-2 text-blue-600" /> Chia sẻ Facebook
              </Button>
              {displayStatus === 'issued' && (
                <Button variant="destructive" className="col-span-2 w-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:text-destructive shadow-sm mt-2" onClick={handleRevoke}>
                  <ShieldAlert className="h-4 w-4 mr-2" /> Thu hồi chứng chỉ
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

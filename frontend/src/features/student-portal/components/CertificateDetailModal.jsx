import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  Download,
  Calendar,
  Hash,
  BookOpen,
  GraduationCap,
  Star,
  Clock,
  ShieldX,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_CONFIG = {
  active: { label: 'Còn hiệu lực', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  issued: { label: 'Đã cấp', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  pending_approval: { label: 'Đang chờ duyệt', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  expired: { label: 'Hết hạn', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  revoked: { label: 'Đã thu hồi', className: 'bg-muted text-muted-foreground border-border' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function CertificateDetailModal({ certificate, open, onClose }) {
  if (!certificate) return null;

  const status = STATUS_CONFIG[certificate.status] || STATUS_CONFIG.issued;
  const isPending = certificate.status === 'pending_approval';
  const isRevoked = certificate.status === 'revoked';
  const isVerifiable = !isPending && !isRevoked;

  const typeName = certificate.certificate_type?.name || 'Chứng chỉ';
  const courseTitle = certificate.class?.course?.title || certificate.course_name || '';
  const classCode = certificate.class?.code || '';
  const certNumber = certificate.certificate_code || certificate.certificate_number || '';
  const verifyUrl = `${window.location.origin}/verify/${certNumber}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Chi tiết chứng chỉ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{typeName}</h3>
              {certNumber && (
                <p className="text-sm text-muted-foreground font-mono flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  {certNumber}
                </p>
              )}
            </div>
            <Badge variant="outline" className={status.className}>
              {isPending && <Clock className="h-3 w-3 mr-1" />}
              {status.label}
            </Badge>
          </div>

          {/* Revoked notice */}
          {isRevoked && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <ShieldX className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">Chứng chỉ đã bị thu hồi</p>
            </div>
          )}

          <hr className="border-border" />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {courseTitle && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Khóa học
                </p>
                <p className="text-sm font-medium">{courseTitle}</p>
              </div>
            )}
            {classCode && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Lớp
                </p>
                <p className="text-sm font-medium">{classCode}</p>
              </div>
            )}
            {certificate.issue_date && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày cấp
                </p>
                <p className="text-sm font-medium">{formatDate(certificate.issue_date)}</p>
              </div>
            )}
            {certificate.expiry_date && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Hết hạn
                </p>
                <p className="text-sm font-medium">{formatDate(certificate.expiry_date)}</p>
              </div>
            )}
            {certificate.grade && (
              <div className="space-y-1 col-span-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  Xếp loại
                </p>
                <p className="text-sm font-semibold text-primary">{certificate.grade}</p>
              </div>
            )}
          </div>

          {/* QR Code */}
          {isVerifiable && (
            <>
              <hr className="border-border" />
              <div className="flex flex-col items-center gap-3 py-2">
                <QRCodeSVG
                  value={verifyUrl}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Quét mã QR để xác thực chứng chỉ
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <hr className="border-border" />
          <div className="flex gap-3">
            {certificate.pdf_url && !isPending && !isRevoked && (
              <Button variant="default" className="flex-1" asChild>
                <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Tải PDF
                </a>
              </Button>
            )}
            {isVerifiable && (
              <Button variant="outline" className="flex-1" asChild>
                <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Xác thực trực tuyến
                </a>
              </Button>
            )}
            {isPending && (
              <p className="text-sm text-muted-foreground text-center w-full py-2">
                Chứng chỉ đang chờ duyệt. Vui lòng đợi admin xử lý.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  ShieldX,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import CertificateTemplate from '../../certificates/components/CertificateTemplate';

const STATUS_CONFIG = {
  active: { label: 'Còn hiệu lực', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  issued: { label: 'Đã cấp', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  pending_approval: { label: 'Đang chờ duyệt', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  expired: { label: 'Hết hạn', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  revoked: { label: 'Đã thu hồi', className: 'bg-muted text-muted-foreground border-border' },
};



export default function CertificateDetailModal({ certificate, open, onClose }) {
  const { user } = useAuth();
  
  if (!certificate) return null;

  const status = STATUS_CONFIG[certificate.status] || STATUS_CONFIG.issued;
  const isPending = certificate.status === 'pending_approval';
  const isRevoked = certificate.status === 'revoked';
  const isVerifiable = !isPending && !isRevoked;

  const typeName = certificate.course_name || certificate.class?.course?.title || certificate.certificate_type?.name || 'Chứng chỉ';
  const category = certificate.certificate_type?.category || 'other';
  const classCode = certificate.class?.code || '';
  const certNumber = certificate.certificate_code || certificate.certificate_number || '';
  const verifyUrl = `${window.location.origin}/verify/${certNumber}`;
  
  const studentName = certificate.student_name || user?.user_metadata?.full_name || user?.email || 'Học viên';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 m-0 text-xl">
            <Award className="h-6 w-6 text-primary" />
            Chi tiết chứng chỉ
          </DialogTitle>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Revoked notice */}
          {isRevoked && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 mb-4">
              <ShieldX className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">Chứng chỉ này đã bị thu hồi và không còn giá trị sử dụng.</p>
            </div>
          )}

          {/* Class Info */}
          {classCode && (
            <div className="flex justify-center -mb-2">
              <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground border">
                Lớp: {classCode}
              </span>
            </div>
          )}

          {/* Visual Certificate Template */}
          <div className="w-full flex justify-center">
            <CertificateTemplate 
              studentName={studentName}
              typeName={typeName}
              grade={certificate.grade}
              certificateNumber={certNumber}
              issueDate={certificate.issue_date}
              category={category}
              showQR={isVerifiable}
              showSerial={true}
              className="max-w-3xl transform scale-90 sm:scale-100 origin-top"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
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
              <div className="w-full text-center p-3 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <p className="text-sm font-medium">
                  Chứng chỉ đang chờ duyệt. Vui lòng đợi quản trị viên xử lý.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

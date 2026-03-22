import React, { useState } from 'react';
import { useStudentCertificates } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Download,
  Calendar,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  Eye,
  Star,
  ShieldX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CertificateDetailModal from '../components/CertificateDetailModal';
import { CERTIFICATE_STATUS_CONFIG } from '../constants/certificate-status';

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

function StatusBadge({ status }) {
  const config = CERTIFICATE_STATUS_CONFIG[status] || CERTIFICATE_STATUS_CONFIG.issued;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

function CertificateCard({ certificate, onClick }) {
  const typeName = certificate.certificate_type?.name || 'Chứng chỉ';
  const classInfo = certificate.class?.code || certificate.class?.name || '--';
  const courseTitle = certificate.course_name || '--';

  const isPending = certificate.status === 'pending_approval';
  const isRevoked = certificate.status === 'revoked';
  const handleDownload = () => {
    if (certificate.pdf_url) {
      const a = document.createElement('a');
      a.href = certificate.pdf_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-all bg-card rounded-2xl min-h-[220px] flex flex-col border-border cursor-pointer',
        isPending && 'opacity-75 border-amber-500/30'
      )}
      onClick={() => onClick?.(certificate)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base">{typeName}</CardTitle>
              <p className="text-sm text-muted-foreground">{certificate.certificate_code}</p>
            </div>
          </div>
          <StatusBadge status={certificate.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Khóa học:</span>
            <span className="font-medium">{courseTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Lớp:</span>
            <span className="font-medium">{classInfo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ngày cấp:</span>
            <span className="font-medium">{formatDate(certificate.issue_date)}</span>
          </div>
          {certificate.expiry_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Hết hạn:</span>
              <span className="font-medium">{formatDate(certificate.expiry_date)}</span>
            </div>
          )}
          {certificate.grade && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Xếp loại:</span>
              <span className="font-medium">{certificate.grade}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onClick?.(certificate); }}>
            <Eye className="h-4 w-4 mr-2" />
            Chi tiết
          </Button>
          {certificate.pdf_url && !isPending && !isRevoked && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Award className="h-16 w-16 mb-4 opacity-30" />
      <h3 className="text-lg font-medium mb-2">Chưa có chứng chỉ</h3>
      <p className="text-sm">Chứng chỉ sẽ hiển thị khi bạn hoàn thành khóa học</p>
    </div>
  );
}

export function StudentCertificates() {
  const { certificates, count, loading, error, refresh } = useStudentCertificates();
  const [selectedCert, setSelectedCert] = useState(null);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải chứng chỉ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-destructive/10 rounded-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chứng chỉ của tôi</h1>
          <p className="text-muted-foreground">
            {count > 0 ? `Bạn có ${count} chứng chỉ` : 'Danh sách chứng chỉ đã nhận'}
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} onClick={setSelectedCert} />
          ))}
        </div>
      ) : (
        <Card className="bg-card rounded-2xl border-border">
          <CardContent className="p-0">
            <EmptyState />
          </CardContent>
        </Card>
      )}
      <CertificateDetailModal
        certificate={selectedCert}
        open={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}

export default StudentCertificates;


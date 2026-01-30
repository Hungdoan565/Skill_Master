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
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const STATUS_CONFIG = {
  active: { label: 'Còn hiệu lực', variant: 'default', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  issued: { label: 'Đã cấp', variant: 'default', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  expired: { label: 'Hết hạn', variant: 'destructive', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  revoked: { label: 'Đã thu hồi', variant: 'secondary', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.issued;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

function CertificateCard({ certificate }) {
  const typeName = certificate.certificate_types?.name || 'Chứng chỉ';
  const className = certificate.classes?.name || '--';
  const courseTitle = certificate.classes?.courses?.title || '--';

  const handleDownload = () => {
    if (certificate.pdf_url) {
      window.open(certificate.pdf_url, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
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
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Khóa học:</span>
            <span className="font-medium">{courseTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Lớp:</span>
            <span className="font-medium">{className}</span>
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
        </div>
        {certificate.pdf_url && (
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Tải PDF
          </Button>
        )}
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
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StudentCertificates;


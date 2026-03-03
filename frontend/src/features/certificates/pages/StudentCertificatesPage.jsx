import { useState } from 'react';
import { Award, Download, Share2, ExternalLink, FileX, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { gooeyToast } from 'goey-toast';
import { useStudentCertificates } from '../hooks/useStudentCertificates';
import { STATUS_CONFIG, CATEGORY_CONFIG, GRADE_CONFIG, getCertificateDisplayStatus } from '../constants';
import CertificatePrintModal from '../components/CertificatePrintModal';

const STATUS_BADGE_MAP = {
  issued: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20',
  pending_approval: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20',
  expiring: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20',
  expired: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
  revoked: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
  rejected: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
};

export default function StudentCertificatesPage() {
  const { certificates, loading } = useStudentCertificates();
  const [selected, setSelected] = useState(null);
  const [printCertificate, setPrintCertificate] = useState(null);

  const handleCopyLink = (cert) => {
    const url = `${window.location.origin}/verify-certificate?cert=${cert.certificate_number}`;
    navigator.clipboard.writeText(url).then(() => {
      gooeyToast.success('Đã copy link xác minh!');
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

  const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const columns = [
    {
      key: 'certificate_type',
      label: 'Loại chứng chỉ',
      render: (value, row) => {
        const typeName = value?.name || row.type_name || '';
        const cat = value?.category || row.category || 'other';
        const catConfig = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        const Icon = catConfig.icon || Award;
        const initials = getInitials(typeName);
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border" style={{ color: catConfig.color }}>
              <span className="text-xs font-bold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{typeName}</span>
          </div>
        );
      },
    },
    {
      key: 'category',
      label: 'Nhóm',
      width: '120px',
      render: (_, row) => {
        const cat = row.certificate_type?.category || row.category || 'other';
        const catConfig = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        return <Badge variant="outline" className="text-xs font-normal border-border text-muted-foreground bg-muted/30">{catConfig.label}</Badge>;
      },
    },
    {
      key: 'grade',
      label: 'Kết quả',
      width: '120px',
      render: (value, row) => {
        if (value) {
          return <span className={`text-sm font-semibold`}>{value}</span>;
        }
        if (row.scores?.overall) return <span className="text-sm font-semibold">{row.scores.overall}</span>;
        if (row.scores?.total) return <span className="text-sm font-semibold">{row.scores.total}</span>;
        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      key: 'issued_at',
      label: 'Ngày cấp',
      width: '110px',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value ? format(new Date(value), 'dd/MM/yyyy') : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      width: '130px',
      render: (_, row) => {
        const displayStatus = getCertificateDisplayStatus(row);
        const statusInfo = STATUS_CONFIG[displayStatus];
        const badgeClass = STATUS_BADGE_MAP[displayStatus] || STATUS_BADGE_MAP.expired;
        return <Badge variant="outline" className={badgeClass}>{statusInfo?.label || 'N/A'}</Badge>;
      },
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6 border border-border">
        <FileX className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Bạn chưa có chứng chỉ nào</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">Hoàn thành khóa học và đạt điểm yêu cầu để nhận chứng chỉ</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chứng chỉ của tôi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {certificates.length > 0 ? `Bạn hiện có ${certificates.length} chứng chỉ trong hồ sơ` : 'Quản lý và chia sẻ chứng chỉ của bạn'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={certificates}
          loading={loading}
          rowKey="id"
          onRowClick={setSelected}
          emptyContent={emptyState}
          className="border-0"
        />
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto bg-card border-l-border p-0">
          {selected && (
            <div className="flex flex-col h-full">
              <div className="bg-muted/30 p-6 border-b border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
                <SheetHeader className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center shrink-0">
                      <Award className="h-7 w-7 text-primary" />
                    </div>
                    <Badge variant="outline" className={STATUS_BADGE_MAP[getCertificateDisplayStatus(selected)] || STATUS_BADGE_MAP.expired}>
                      {STATUS_CONFIG[getCertificateDisplayStatus(selected)]?.label}
                    </Badge>
                  </div>
                  <div>
                    <SheetTitle className="text-xl leading-tight text-foreground">{selected.certificate_type?.name || selected.type_name}</SheetTitle>
                    {selected.certificate_number && (
                      <p className="font-mono text-sm text-muted-foreground mt-2 bg-background border border-border px-2 py-1 rounded-md inline-block">
                        {selected.certificate_number}
                      </p>
                    )}
                  </div>
                </SheetHeader>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Thông tin chi tiết</h4>
                  
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Xếp loại / Điểm</span>
                      <span className="text-sm font-semibold text-foreground">
                        {selected.grade ? (
                          <>{selected.grade} {GRADE_CONFIG[selected.grade] ? `(${GRADE_CONFIG[selected.grade].en})` : ''}</>
                        ) : selected.scores?.overall ? (
                          selected.scores.overall
                        ) : selected.scores?.total ? (
                          selected.scores.total
                        ) : '—'}
                      </span>
                    </div>
                    
                    {selected.issued_at && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Ngày cấp</span>
                        <span className="text-sm font-medium text-foreground">{format(new Date(selected.issued_at), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                    
                    {selected.expires_at && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Ngày hết hạn</span>
                        <span className="text-sm font-medium text-foreground">{format(new Date(selected.expires_at), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                    
                    {selected.external_id && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Mã gốc (External ID)</span>
                        <span className="text-sm font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">{selected.external_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 mt-auto">
                  {!selected.is_external && selected.status !== 'revoked' && selected.approval_status !== 'pending_approval' && (
                    <Button onClick={() => setPrintCertificate(selected)} className="w-full sm:w-auto flex-1 h-10 shadow-sm">
                      <Printer className="h-4 w-4 mr-2" /> In / PDF
                    </Button>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handleCopyLink(selected)} className="flex-1 h-10 border-border bg-background hover:bg-muted text-foreground">
                      <Share2 className="h-4 w-4 mr-2" /> Chia sẻ link
                    </Button>
                    
                    {selected.external_verify_url && (
                      <Button variant="outline" onClick={() => window.open(selected.external_verify_url, '_blank')} className="flex-1 h-10 border-border bg-background hover:bg-muted text-foreground">
                        <ExternalLink className="h-4 w-4 mr-2" /> Link gốc
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CertificatePrintModal
        certificate={printCertificate}
        open={!!printCertificate}
        onOpenChange={(open) => { if (!open) setPrintCertificate(null); }}
      />
    </div>
  );
}

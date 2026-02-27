import { useState, useEffect } from 'react';
import { Award, Plus, FileText, Printer, Ban, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import DashboardStats from '../components/DashboardStats';
import { getCertificateColumns } from '../components/CertificateColumns';
import CertificateFilters from '../components/CertificateFilters';
import CertificateDetailSheet from '../components/CertificateDetailSheet';
import CertificateTypesGrid from '../components/CertificateTypesGrid';
import IssueInternalWizard from '../components/wizard/IssueInternalWizard';
import RecordExternalModal from '../components/RecordExternalModal';
import PendingApprovalsDialog from '../components/PendingApprovalsDialog';
import { useCertificates } from '../hooks/useCertificates';
import { useCertificateTypes } from '../hooks/useCertificateTypes';

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);

  const {
    certificates, loading, pagination,
    setPage, setPageSize, setFilters, setSorting,
    refresh, revokeCertificate,
  } = useCertificates();

  const { certificateTypes, loading: typesLoading, fetchCertificateTypes } = useCertificateTypes();

  useEffect(() => {
    fetchCertificateTypes();
  }, []);

  const [filters, setLocalFilters] = useState({});

  const handleFilterChange = (newFilters) => {
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleView = (cert) => setSelectedCertificate(cert);

  const handlePrint = (cert) => {
    window.open(`/certificates/print/${cert.id}`, '_blank');
  };

  const handleCopyLink = (cert) => {
    const url = `${window.location.origin}/verify-certificate/${cert.certificate_number}`;
    navigator.clipboard.writeText(url);
    toast.success('Đã copy link xác minh');
  };

  const handleRevoke = async (cert) => {
    const reason = window.prompt('Lý do thu hồi:');
    if (!reason) return;
    const result = await revokeCertificate(cert.id, reason);
    if (result.success) {
      toast.success('Đã thu hồi chứng chỉ');
      setSelectedCertificate(null);
    } else {
      toast.error(result.error || 'Có lỗi xảy ra');
    }
  };

  const columns = getCertificateColumns({
    onView: handleView,
    onPrint: handlePrint,
    onCopyLink: handleCopyLink,
    onRevoke: handleRevoke,
  });

  const handleSuccess = () => {
    refresh();
  };

  const handleSort = (column) => {
    setSorting(column, 'desc');
  };

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Header Area with Subtle Background/Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm p-6 sm:p-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Award className="h-6 w-6" />
              </div>
              Quản lý chứng chỉ
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Quản lý cấp phát, theo dõi hiệu lực và ghi nhận chứng chỉ cho học viên toàn hệ thống.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setExternalModalOpen(true)}
              className="border-border hover:bg-accent transition-colors shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
              Ghi nhận chứng chỉ ngoài
            </Button>
            <Button 
              onClick={() => setWizardOpen(true)}
              className="shadow-sm hover:shadow transition-all group"
            >
              <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Cấp chứng chỉ
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted border border-border/50 p-1 rounded-xl shadow-sm inline-flex mb-2">
          <TabsTrigger value="overview" className="rounded-lg px-6 data-[state=active]:shadow-sm">Tổng quan</TabsTrigger>
          <TabsTrigger value="issued" className="rounded-lg px-6 data-[state=active]:shadow-sm">Đã cấp</TabsTrigger>
          <TabsTrigger value="types" className="rounded-lg px-6 data-[state=active]:shadow-sm">Loại chứng chỉ</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* Tab: Overview */}
          <TabsContent value="overview" className="focus-visible:outline-none focus-visible:ring-0">
            <DashboardStats onViewPending={() => setPendingDialogOpen(true)} />
          </TabsContent>

          {/* Tab: Issued */}
          <TabsContent value="issued" className="space-y-5 focus-visible:outline-none focus-visible:ring-0">
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm">
              <CertificateFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                certificateTypes={certificateTypes}
              />
            </div>

            {/* Bulk actions */}
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex items-center gap-2 pl-2 border-r border-border pr-4">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {selectedRows.length}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    chứng chỉ đã chọn
                  </span>
                </div>
                <Button size="sm" variant="secondary" className="hover:bg-accent transition-colors bg-background" onClick={() => toast.info('Đang phát triển...')}>
                  <Printer className="h-4 w-4 mr-2" /> In hàng loạt
                </Button>
                <Button size="sm" variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive" onClick={() => toast.info('Đang phát triển...')}>
                  <Ban className="h-4 w-4 mr-2" /> Thu hồi hàng loạt
                </Button>
              </div>
            )}

            <div className="rounded-xl border border-border/50 shadow-sm bg-card overflow-hidden">
              <DataTable
                columns={columns}
                data={certificates}
                loading={loading}
                selectable
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                rowKey="id"
                sortable
                onSort={handleSort}
                currentPage={pagination.page}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRowClick={handleView}
                emptyTitle="Chưa có chứng chỉ nào"
                emptyDescription="Bắt đầu cấp chứng chỉ cho học viên hoặc ghi nhận chứng chỉ bên ngoài."
                emptyIcon={<Sparkles className="h-12 w-12 text-muted-foreground/30" />}
              />
            </div>
          </TabsContent>

          {/* Tab: Types */}
          <TabsContent value="types" className="focus-visible:outline-none focus-visible:ring-0">
            <CertificateTypesGrid types={certificateTypes} loading={typesLoading} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals & Sheets */}
      <CertificateDetailSheet
        certificate={selectedCertificate}
        open={!!selectedCertificate}
        onOpenChange={(open) => { if (!open) setSelectedCertificate(null); }}
        onRevoke={(id, reason) => revokeCertificate(id, reason).then(r => { if (r.success) { toast.success('Đã thu hồi'); setSelectedCertificate(null); refresh(); } })}
        onPrint={handlePrint}
      />

      <IssueInternalWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleSuccess}
      />

      <RecordExternalModal
        open={externalModalOpen}
        onOpenChange={setExternalModalOpen}
        onSuccess={handleSuccess}
      />

      <PendingApprovalsDialog
        open={pendingDialogOpen}
        onOpenChange={setPendingDialogOpen}
        onApprove={handleSuccess}
        onReject={handleSuccess}
      />
    </div>
  );
}

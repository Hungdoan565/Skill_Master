import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CertificateRevokeModal({ certificate, open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(certificate.id, reason.trim());
      setReason('');
      onOpenChange(false);
    } catch {
      // error handled by parent via toast
    } finally {
      setLoading(false);
    }
  };

  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center">Thu hồi chứng chỉ</DialogTitle>
          <DialogDescription className="text-center">
            Hành động này sẽ thu hồi chứng chỉ và không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Certificate info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã chứng chỉ</span>
              <span className="font-mono font-medium">{certificate.certificate_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Học viên</span>
              <span className="font-medium">{certificate.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loại</span>
              <span>{certificate.certificate_type?.name || '—'}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Chứng chỉ đã thu hồi sẽ không còn hiệu lực và sẽ hiển thị trạng thái "Đã thu hồi" trên trang xác minh công khai.</span>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <label htmlFor="revoke-reason" className="text-sm font-medium">
              Lý do thu hồi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="revoke-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thu hồi chứng chỉ..."
              rows={3}
              disabled={loading}
              className={cn(
                "w-full rounded-md border border-input bg-white px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "resize-none"
              )}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Xác nhận thu hồi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

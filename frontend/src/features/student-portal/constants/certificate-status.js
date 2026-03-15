/**
 * Certificate status configuration constants
 * Shared between StudentCertificates and CertificateDetailModal
 */

export const CERTIFICATE_STATUS_CONFIG = {
  active: { label: 'Còn hiệu lực', variant: 'default', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  issued: { label: 'Đã cấp', variant: 'default', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  pending_approval: { label: 'Đang chờ duyệt', variant: 'default', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  expired: { label: 'Hết hạn', variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  revoked: { label: 'Đã thu hồi', variant: 'secondary', className: 'bg-muted text-muted-foreground border-border' }
};

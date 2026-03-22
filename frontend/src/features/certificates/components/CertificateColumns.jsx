import { format } from 'date-fns';
import { Eye, Printer, Link2, Ban, MoreHorizontal, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATUS_CONFIG, CATEGORY_CONFIG, getCertificateDisplayStatus } from '../constants';

const STATUS_STYLE_MAP = {
  issued: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 hover:bg-green-500/20',
  pending_approval: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  expiring: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 hover:bg-amber-500/20',
  expired: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  revoked: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function getCertificateColumns({ onView, onPrint, onCopyLink, onRevoke }) {
  return [
    {
      key: 'certificate_number',
      label: 'Mã chứng chỉ',
      sortable: true,
      width: '160px',
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        // Defensive: guard against object accidentally passed as value
        const code = typeof value === 'object' ? value.code : value;
        return (
          <div className="flex items-center group">
            <code className="text-xs font-mono font-medium bg-muted text-foreground px-2 py-1 rounded-md border border-border/50 group-hover:border-primary/30 transition-colors cursor-default">
              {code}
            </code>
          </div>
        );
      },
    },
    {
      key: 'student_name',
      label: 'Học viên',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 border border-primary/20">
            {getInitials(value)}
          </div>
          <span className="font-medium text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: 'certificate_type',
      label: 'Loại',
      render: (value, row) => {
        const typeName = value?.name || row.type_name || '';
        const category = value?.category || row.category || 'other';
        const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: catConfig.color }} />
            <span className="text-sm truncate text-foreground font-medium" title={typeName}>{typeName}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      width: '150px',
      render: (value, row) => {
        const displayStatus = getCertificateDisplayStatus(row);
        const statusInfo = STATUS_CONFIG[displayStatus];
        const styleClass = STATUS_STYLE_MAP[displayStatus] || STATUS_STYLE_MAP.expired;
        
        return (
          <Badge variant="outline" className={`text-xs font-medium border shadow-sm transition-colors ${styleClass}`}>
            {statusInfo?.label || value}
          </Badge>
        );
      },
    },
    {
      key: 'issued_at',
      label: 'Ngày cấp',
      sortable: true,
      width: '120px',
      render: (value) => (
        <span className="text-sm font-medium text-muted-foreground">
          {value ? format(new Date(value), 'dd/MM/yyyy') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (_, row) => {
        const displayStatus = getCertificateDisplayStatus(row);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView?.(row)} className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" /> 
                <span className="font-medium">Xem chi tiết</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint?.(row)} className="cursor-pointer">
                <Printer className="h-4 w-4 mr-2 text-muted-foreground" /> 
                <span className="font-medium">In / Xuất PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyLink?.(row)} className="cursor-pointer">
                <Link2 className="h-4 w-4 mr-2 text-muted-foreground" /> 
                <span className="font-medium">Copy link xác minh</span>
              </DropdownMenuItem>
              {displayStatus === 'issued' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRevoke?.(row)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                    <Ban className="h-4 w-4 mr-2" /> 
                    <span className="font-medium">Thu hồi chứng chỉ</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

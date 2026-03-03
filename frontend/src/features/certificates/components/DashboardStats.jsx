import { Award, CheckCircle, AlertTriangle, XCircle, ChevronRight, Clock, Activity, FileCheck2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCertificateStats } from '../hooks/useCertificateStats';
import { CATEGORY_CONFIG, getCertificateDisplayStatus, STATUS_CONFIG } from '../constants';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

function StatCard({ title, value, icon: Icon, description, trend, variant = 'default' }) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-border"
  };

  const iconStyles = variants[variant] || variants.default;

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border-border/50 bg-white">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className={`p-3 rounded-xl border ${iconStyles} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center text-xs">
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
      {/* Subtle bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-1 w-full opacity-50 ${iconStyles.split(' ')[0]}`} />
    </Card>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function DashboardStats({ onViewPending }) {
  const { stats, loading } = useCertificateStats();

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 border-border/50">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 w-full">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded-xl flex-shrink-0" />
              </div>
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-[400px] bg-muted animate-pulse border-border/50" />
          <Card className="h-[400px] bg-muted animate-pulse border-border/50" />
        </div>
      </div>
    );
  }

  const maxTopTypeCount = Math.max(...(stats.topTypes?.map(t => t.count) || [1]));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Award} 
          title="Tổng đã cấp" 
          value={stats.totalIssued} 
          variant="default"
          description="Toàn bộ hệ thống"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Còn hiệu lực" 
          value={stats.activeCount} 
          variant="success"
          description="Đang sử dụng"
        />
        <StatCard
          icon={AlertTriangle}
          title="Sắp hết hạn"
          value={stats.expiringSoon}
          variant={stats.expiringSoon > 0 ? 'warning' : 'muted'}
          description="Trong vòng 30 ngày tới"
        />
        <StatCard 
          icon={XCircle} 
          title="Đã thu hồi" 
          value={stats.revokedCount} 
          variant="destructive"
          description="Quyết định vô hiệu lực"
        />
      </div>

      {/* Pending Approvals Banner */}
      {stats.pendingApprovalCount > 0 && (
        <div className="group relative overflow-hidden rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5 transition-all hover:bg-amber-500/15">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-500 animate-pulse">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-500">
                  {stats.pendingApprovalCount} chứng chỉ đang chờ duyệt
                </h4>
                <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
                  Cần được kiểm tra và xác nhận trước khi cấp phát chính thức.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onViewPending} 
              className="border-amber-500/30 text-amber-700 dark:text-amber-500 hover:bg-amber-500/20 bg-white shadow-sm whitespace-nowrap"
            >
              Xử lý ngay <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* Two columns: Recent + Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Certificates */}
        <Card className="flex flex-col border-border/50 shadow-sm overflow-hidden bg-white">
          <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold tracking-tight text-foreground">Hoạt động cấp phát gần đây</h3>
            </div>
          </div>
          
          <div className="p-0 flex-1 overflow-auto">
            {stats.recentCertificates?.length > 0 ? (
              <div className="divide-y divide-border/50">
                {stats.recentCertificates.map((cert, i) => {
                  const displayStatus = getCertificateDisplayStatus(cert);
                  const statusInfo = STATUS_CONFIG[displayStatus];
                  const isRevoked = displayStatus === 'revoked';
                  
                  return (
                    <div key={cert.id || i} className="flex items-center justify-between p-4 hover:bg-muted transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 shadow-sm
                          ${isRevoked ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {getInitials(cert.student_name)}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isRevoked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {cert.student_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                              {cert.certificate_type?.name || cert.type_name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {cert.certificate_number}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${isRevoked ? 'bg-destructive' : 'bg-green-500'}`} />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {cert.issued_at ? formatDistanceToNow(new Date(cert.issued_at), { addSuffix: true, locale: vi }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <FileCheck2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Chưa có hoạt động cấp chứng chỉ nào</p>
              </div>
            )}
          </div>
        </Card>

        {/* Top Certificate Types */}
        <Card className="flex flex-col border-border/50 shadow-sm overflow-hidden bg-white">
          <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-semibold tracking-tight text-foreground">Loại chứng chỉ phổ biến</h3>
            </div>
          </div>

          <div className="p-5 flex-1 overflow-auto">
            {stats.topTypes?.length > 0 ? (
              <div className="space-y-6">
                {stats.topTypes.map((type, i) => {
                  const catConfig = CATEGORY_CONFIG[type.category] || CATEGORY_CONFIG.other;
                  const percent = Math.round((type.count / maxTopTypeCount) * 100);
                  
                  const isTop1 = i === 0;
                  const isTop2 = i === 1;
                  const isTop3 = i === 2;
                  
                  const rankStyles = isTop1 
                    ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/30 dark:text-yellow-400"
                    : isTop2 
                    ? "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-300"
                    : isTop3 
                    ? "bg-amber-600/15 text-amber-700 border-amber-600/30 dark:text-amber-500"
                    : "bg-muted text-muted-foreground border-border/50";
                  
                  return (
                    <div key={type.id || i} className="group relative">
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex items-start gap-3.5">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold shadow-sm shrink-0 mt-0.5 ${rankStyles}`}>
                            {i + 1}
                          </div>
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-sm font-semibold text-foreground line-clamp-1 leading-none" title={type.name}>
                              {type.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {catConfig.icon && <catConfig.icon className="w-3.5 h-3.5" style={{ color: catConfig.color }} />}
                              <span 
                                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                style={{ 
                                  backgroundColor: `${catConfig.color}15`, 
                                  color: catConfig.color 
                                }}
                              >
                                {catConfig.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono bg-white text-foreground font-bold border-border/50 shadow-sm shrink-0 ml-4">
                          {type.count}
                        </Badge>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-2.5 w-full bg-slate-50 overflow-hidden rounded-full ml-[42px] shadow-inner" style={{ width: 'calc(100% - 42px)' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                          style={{ 
                            width: `${percent}%`, 
                            background: `linear-gradient(90deg, ${catConfig.color}80, ${catConfig.color})`,
                          }} 
                        >
                          <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <Award className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu thống kê loại chứng chỉ</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

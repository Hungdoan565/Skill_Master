import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { gooeyToast } from 'goey-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon, 
  ArrowUpDown, 
  Building2,
  Users,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  GraduationCap,
  BarChart3,
  Medal
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const normalizeCenter = (center) => ({
  ...center,
  id: center.id ?? center.center_id,
  name: center.name ?? center.center_name ?? 'Chưa đặt tên',
});

/* ─── Circular Health Gauge ───────────────────────────────────────── */
const HealthRing = ({ score, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
};

/* ─── KPI Summary Card ────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, subtitle, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("absolute inset-0 opacity-[0.04]", color)} />
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

/* ─── Podium Card (Top 3) ─────────────────────────────────────────── */
const podiumConfig = [
  { 
    rank: 1, 
    medal: '🥇', 
    gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent', 
    border: 'border-amber-300/40 dark:border-amber-700/30',
    ring: 'ring-amber-400/20',
    accentText: 'text-amber-600 dark:text-amber-400',
    scale: 'md:scale-105'
  },
  { 
    rank: 2, 
    medal: '🥈', 
    gradient: 'from-slate-400/10 via-slate-300/5 to-transparent', 
    border: 'border-slate-300/40 dark:border-slate-600/30',
    ring: 'ring-slate-400/20',
    accentText: 'text-slate-500 dark:text-slate-400',
    scale: ''
  },
  { 
    rank: 3, 
    medal: '🥉', 
    gradient: 'from-orange-500/10 via-orange-400/5 to-transparent', 
    border: 'border-orange-300/40 dark:border-orange-700/30',
    ring: 'ring-orange-400/20',
    accentText: 'text-orange-600 dark:text-orange-400',
    scale: ''
  },
];

const PodiumCard = ({ center, config, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, type: 'spring', stiffness: 100 }}
    className={cn("flex-1 min-w-[200px]", config.scale)}
  >
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      config.border,
      "ring-1",
      config.ring
    )}>
      <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl drop-shadow-sm">{config.medal}</span>
          <HealthRing score={center.health_score ?? 0} size={52} strokeWidth={4} />
        </div>
        <h3 className={cn("font-bold text-base mb-1 truncate", config.accentText)}>
          {center.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Users className="h-3 w-3" /> {center.staff_count || 0} NS
          <span className="mx-0.5">•</span>
          {center.class_count || 0} Lớp
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/60 dark:bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground font-medium">Doanh thu</p>
            <p className="text-sm font-bold text-foreground">
              {formatCurrencyShort(center.revenue)}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-white/5 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground font-medium">Học viên</p>
            <p className="text-sm font-bold text-foreground">
              {center.student_count?.toLocaleString('vi-VN') || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

/* ─── Utils ───────────────────────────────────────────────────────── */
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatCurrencyShort = (value) => {
  if (!value) return '0 ₫';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${value} ₫`;
};

const formatPercent = (value) => {
  if (value === undefined || value === null) return '0%';
  return `${value}%`;
};

/* ─── Main Component ──────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const { session } = useAuth();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [sortBy, setSortBy] = useState('health_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const abortControllerRef = useRef(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!session?.access_token) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/center-health?period=${period}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        signal: controller.signal
      });
      
      const data = await res.json();
      
      if (data.success) {
        const rawCenters = Array.isArray(data.data) ? data.data : (data.data?.centers || []);
        setCenters(rawCenters.map(normalizeCenter));
      } else {
        setError(data.message || 'Lỗi khi tải dữ liệu bảng xếp hạng');
        gooeyToast.error(data.message || 'Lỗi khi tải dữ liệu bảng xếp hạng');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching leaderboard:', err);
      setError('Không thể kết nối đến máy chủ');
      gooeyToast.error('Không thể kết nối đến máy chủ');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [session?.access_token, period]);

  useEffect(() => {
    fetchLeaderboard();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchLeaderboard]);

  const sortedCenters = useMemo(() => {
    return [...centers].sort((a, b) => {
      let aVal = a[sortBy] ?? 0;
      let bVal = b[sortBy] ?? 0;
      if (aVal === bVal) return a.name?.localeCompare(b.name) || 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [centers, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  /* ─── KPI Aggregates ────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (!centers.length) return null;
    const totalRevenue = centers.reduce((s, c) => s + (c.revenue || 0), 0);
    const totalStudents = centers.reduce((s, c) => s + (c.student_count || 0), 0);
    const avgHealth = Math.round(centers.reduce((s, c) => s + (c.health_score || 0), 0) / centers.length);
    const totalClasses = centers.reduce((s, c) => s + (c.class_count || 0), 0);
    return { totalRevenue, totalStudents, avgHealth, totalClasses };
  }, [centers]);

  const getHealthStatusDisplay = (status, score) => {
    const configs = {
      healthy: { label: 'Tốt', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
      warning: { label: 'Cảnh báo', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
      critical: { label: 'Nguy hiểm', bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
    };
    const cfg = configs[status] || { label: 'Không rõ', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
    return (
      <div className="flex items-center gap-2.5">
        <HealthRing score={score ?? 0} />
        <Badge className={cn(cfg.bg, cfg.text, cfg.border, "hover:opacity-80 text-[11px] font-medium")}>{cfg.label}</Badge>
      </div>
    );
  };

  const getRankDisplay = (index) => {
    if (index === 0) return <span className="text-2xl drop-shadow-sm" title="Hạng 1">🥇</span>;
    if (index === 1) return <span className="text-2xl drop-shadow-sm" title="Hạng 2">🥈</span>;
    if (index === 2) return <span className="text-2xl drop-shadow-sm" title="Hạng 3">🥉</span>;
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs mx-auto">
        {index + 1}
      </div>
    );
  };

  const SortableHead = ({ field, label, align = 'left' }) => {
    const isSorted = sortBy === field;
    return (
      <TableHead 
        className={cn(
          "cursor-pointer select-none hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap text-xs", 
          align === 'right' && "text-right", 
          align === 'center' && "text-center"
        )} 
        onClick={() => handleSort(field)}
      >
        <div className={cn(
          "flex items-center gap-1", 
          align === 'right' && "justify-end", 
          align === 'center' && "justify-center"
        )}>
          {label}
          {isSorted ? (
            sortOrder === 'asc' ? <ArrowUpIcon className="h-3.5 w-3.5 text-orange-500" /> : <ArrowDownIcon className="h-3.5 w-3.5 text-orange-500" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
        </div>
      </TableHead>
    );
  };

  /* ─── Progress Bar ──────────────────────────────────────────────── */
  const ProgressCell = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <span className="font-semibold text-sm">{label || formatPercent(value)}</span>
      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            "h-full rounded-full",
            value >= 90 ? "bg-emerald-500" :
            value >= 75 ? "bg-amber-500" : 
            value > 0 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
          )}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20 text-orange-600 dark:text-orange-400 rounded-xl shadow-sm">
              <Trophy className="h-6 w-6" />
            </div>
            Bảng Xếp Hạng
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Theo dõi và đánh giá hiệu quả hoạt động của các trung tâm
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2.5"
        >
          <Select value={period} onValueChange={setPeriod} disabled={loading}>
            <SelectTrigger className="w-[160px] bg-white dark:bg-slate-900 text-sm">
              <SelectValue placeholder="Chọn kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Tháng này</SelectItem>
              <SelectItem value="last_month">Tháng trước</SelectItem>
              <SelectItem value="this_quarter">Quý này</SelectItem>
              <SelectItem value="this_year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchLeaderboard} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Làm mới
          </Button>
        </motion.div>
      </div>

      {/* ─── KPI Summary Cards ────────────────────────────────────── */}
      {!loading && kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={DollarSign} label="Tổng doanh thu" value={formatCurrencyShort(kpis.totalRevenue)} color="bg-blue-500" delay={0} />
          <KpiCard icon={GraduationCap} label="Tổng học viên" value={kpis.totalStudents.toLocaleString('vi-VN')} subtitle={`${centers.length} cơ sở`} color="bg-violet-500" delay={0.05} />
          <KpiCard icon={BarChart3} label="Sức khỏe TB" value={`${kpis.avgHealth}/100`} subtitle={kpis.avgHealth >= 80 ? 'Tốt' : kpis.avgHealth >= 60 ? 'Cảnh báo' : 'Cần cải thiện'} color="bg-emerald-500" delay={0.1} />
          <KpiCard icon={Building2} label="Tổng lớp học" value={kpis.totalClasses.toLocaleString('vi-VN')} color="bg-orange-500" delay={0.15} />
        </div>
      )}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-slate-200/60 dark:border-slate-800/60">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Top 3 Podium ─────────────────────────────────────────── */}
      {!loading && sortedCenters.length >= 3 && (
        <div className="flex flex-col md:flex-row gap-3">
          {sortedCenters.slice(0, 3).map((center, i) => (
            <PodiumCard key={center.id} center={center} config={podiumConfig[i]} delay={0.1 + i * 0.08} />
          ))}
        </div>
      )}

      {/* ─── Main Table ───────────────────────────────────────────── */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/50 dark:to-slate-900/30 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Medal className="h-4 w-4 text-orange-500" />
                Xếp hạng chi tiết
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Sắp xếp theo {
                  sortBy === 'health_score' ? 'Điểm sức khỏe' :
                  sortBy === 'revenue' ? 'Doanh thu' :
                  sortBy === 'student_count' ? 'Số học viên' :
                  sortBy === 'attendance_rate' ? 'Tỷ lệ chuyên cần' :
                  sortBy === 'collection_rate' ? 'Tỷ lệ thu học phí' : 'Tên cơ sở'
                } ({sortOrder === 'desc' ? '↓ Giảm dần' : '↑ Tăng dần'})
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px]">
              {centers.length} cơ sở
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/20">
                  <TableHead className="w-[60px] text-center font-semibold text-xs">Hạng</TableHead>
                  <SortableHead field="name" label="Cơ sở" />
                  <SortableHead field="health_score" label="Sức khỏe" />
                  <SortableHead field="revenue" label="Doanh thu" align="right" />
                  <SortableHead field="student_count" label="Học viên" align="center" />
                  <SortableHead field="attendance_rate" label="Chuyên cần" align="center" />
                  <SortableHead field="collection_rate" label="Tỷ lệ thu" align="center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center"><Skeleton className="h-7 w-7 rounded-full mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><div className="flex gap-2"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-14" /></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                        <p className="text-muted-foreground">{error}</p>
                        <Button size="sm" variant="outline" onClick={fetchLeaderboard}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Thử lại
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Trophy className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground">Không có dữ liệu cơ sở nào để hiển thị</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {sortedCenters.map((center, index) => (
                      <motion.tr
                        key={center.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className={cn(
                          "group border-b transition-colors",
                          index < 3
                            ? "bg-gradient-to-r from-orange-50/40 via-amber-50/20 to-transparent dark:from-orange-950/10 dark:via-amber-950/5 hover:from-orange-50/60 dark:hover:from-orange-950/20"
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        )}
                      >
                        <TableCell className="text-center font-medium py-3">
                          {getRankDisplay(index)}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg transition-transform group-hover:scale-105",
                              index === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                              index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                              index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                              "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {center.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {center.staff_count || 0} NS</span>
                                <span>•</span>
                                <span>{center.class_count || 0} Lớp</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {getHealthStatusDisplay(center.health_status, center.health_score)}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="font-semibold text-sm text-foreground">{formatCurrency(center.revenue)}</div>
                          <div className={cn(
                            "text-[11px] flex items-center justify-end gap-0.5 mt-0.5 font-medium", 
                            (center.revenue_change > 0) ? "text-emerald-600 dark:text-emerald-400" : 
                            (center.revenue_change < 0) ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                          )}>
                            {center.revenue_change > 0 ? <ArrowUpIcon className="h-3 w-3" /> : 
                             center.revenue_change < 0 ? <ArrowDownIcon className="h-3 w-3" /> : 
                             <MinusIcon className="h-3 w-3" />}
                            {Math.abs(center.revenue_change || 0)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="font-semibold text-sm">{center.student_count?.toLocaleString('vi-VN') || 0}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            +{center.enrollment_count || 0} mới
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <ProgressCell value={center.attendance_rate} />
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <ProgressCell value={center.collection_rate} />
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

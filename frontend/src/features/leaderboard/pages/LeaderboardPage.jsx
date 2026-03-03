import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { gooeyToast } from 'goey-toast';
import { 
  Trophy, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon, 
  ArrowUpDown, 
  Building2,
  Users
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

export default function LeaderboardPage() {
  const { session } = useAuth();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [sortBy, setSortBy] = useState('health_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLeaderboard = async () => {
    if (!session?.access_token) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/center-health?period=${period}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setCenters(data.data.centers || []);
      } else {
        gooeyToast.error(data.message || 'Lỗi khi tải dữ liệu bảng xếp hạng');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      gooeyToast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [session?.access_token, period]);

  const sortedCenters = useMemo(() => {
    return [...centers].sort((a, b) => {
      let aVal = a[sortBy] ?? 0;
      let bVal = b[sortBy] ?? 0;
      
      // Secondary sort by name to ensure stable sorting
      if (aVal === bVal) {
        return a.name?.localeCompare(b.name) || 0;
      }
      
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

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  const formatPercent = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${value}%`;
  };

  const getHealthStatusDisplay = (status, score) => {
    switch (status) {
      case 'healthy':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Tốt</Badge>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{score}/100</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">Cảnh báo</Badge>
            <span className="font-semibold text-amber-700 dark:text-amber-400">{score}/100</span>
          </div>
        );
      case 'critical':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">Nguy hiểm</Badge>
            <span className="font-semibold text-red-700 dark:text-red-400">{score}/100</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">Không rõ</Badge>
            <span className="font-medium text-muted-foreground">{score}/100</span>
          </div>
        );
    }
  };

  const getRankDisplay = (index) => {
    if (index === 0) return <span className="text-3xl drop-shadow-sm" title="Hạng 1">🥇</span>;
    if (index === 1) return <span className="text-3xl drop-shadow-sm" title="Hạng 2">🥈</span>;
    if (index === 2) return <span className="text-3xl drop-shadow-sm" title="Hạng 3">🥉</span>;
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm mx-auto">
        {index + 1}
      </div>
    );
  };

  const SortableHead = ({ field, label, align = 'left' }) => {
    const isSorted = sortBy === field;
    return (
      <TableHead 
        className={cn(
          "cursor-pointer select-none hover:bg-muted/50 transition-colors whitespace-nowrap", 
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
            sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4 text-orange-500" /> : <ArrowDownIcon className="h-4 w-4 text-orange-500" />
          ) : (
            <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
              <Trophy className="h-6 w-6" />
            </div>
            Bảng Xếp Hạng Cơ Sở
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và đánh giá hiệu quả hoạt động của các trung tâm
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod} disabled={loading}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Tháng này</SelectItem>
              <SelectItem value="last_month">Tháng trước</SelectItem>
              <SelectItem value="this_quarter">Quý này</SelectItem>
              <SelectItem value="this_year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchLeaderboard} disabled={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
          <CardTitle className="text-lg">Xếp hạng tổng thể</CardTitle>
          <CardDescription>
            Đang sắp xếp theo {
              sortBy === 'health_score' ? 'Điểm sức khỏe' :
              sortBy === 'revenue' ? 'Doanh thu' :
              sortBy === 'student_count' ? 'Số học viên' :
              sortBy === 'attendance_rate' ? 'Tỷ lệ chuyên cần' :
              sortBy === 'collection_rate' ? 'Tỷ lệ thu học phí' : 'Tên cơ sở'
            } ({sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/20">
                <TableRow>
                  <TableHead className="w-[80px] text-center font-semibold">Hạng</TableHead>
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
                      <TableCell className="text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Không có dữ liệu cơ sở nào để hiển thị
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCenters.map((center, index) => (
                    <TableRow 
                      key={center.id} 
                      className={cn(
                        "group transition-colors",
                        index < 3 ? "bg-orange-50/30 dark:bg-orange-950/10 hover:bg-orange-50/50 dark:hover:bg-orange-950/20" : ""
                      )}
                    >
                      <TableCell className="text-center font-medium">
                        {getRankDisplay(index)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            index === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                            index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                            index === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          )}>
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {center.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {center.staff_count || 0} NS</span>
                              <span>•</span>
                              <span>{center.class_count || 0} Lớp</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getHealthStatusDisplay(center.health_status, center.health_score)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-foreground">{formatCurrency(center.revenue)}</div>
                        <div className={cn(
                          "text-xs flex items-center justify-end gap-0.5 mt-1 font-medium", 
                          (center.revenue_change > 0) ? "text-emerald-600 dark:text-emerald-400" : 
                          (center.revenue_change < 0) ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        )}>
                          {center.revenue_change > 0 ? <ArrowUpIcon className="h-3 w-3" /> : 
                           center.revenue_change < 0 ? <ArrowDownIcon className="h-3 w-3" /> : 
                           <MinusIcon className="h-3 w-3" />}
                          {Math.abs(center.revenue_change || 0)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium">{center.student_count?.toLocaleString('vi-VN')}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          +{center.enrollment_count || 0} mới
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{formatPercent(center.attendance_rate)}</span>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                center.attendance_rate >= 90 ? "bg-emerald-500" :
                                center.attendance_rate >= 75 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(100, Math.max(0, center.attendance_rate || 0))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{formatPercent(center.collection_rate)}</span>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                center.collection_rate >= 90 ? "bg-emerald-500" :
                                center.collection_rate >= 75 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(100, Math.max(0, center.collection_rate || 0))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

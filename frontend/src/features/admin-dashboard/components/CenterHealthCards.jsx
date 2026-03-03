import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function CenterHealthCards({ centers }) {
  if (!centers || centers.length === 0) return null;

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';

  const getHealthBadge = (status) => {
    switch (status) {
      case 'good': 
        return <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-900 dark:text-green-400 bg-green-50 dark:bg-green-900/10">Tốt</Badge>;
      case 'warning': 
        return <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-900 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10">Cần theo dõi</Badge>;
      case 'critical': 
        return <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-900 dark:text-red-400 bg-red-50 dark:bg-red-900/10">Cảnh báo</Badge>;
      default: 
        return <Badge variant="outline">Chưa rõ</Badge>;
    }
  };

  const getCardBorderColor = (status) => {
    switch (status) {
      case 'good': return 'border-t-4 border-t-green-500';
      case 'warning': return 'border-t-4 border-t-amber-500';
      case 'critical': return 'border-t-4 border-t-red-500';
      default: return 'border-t-4 border-t-gray-500';
    }
  };

  const getProgressBarColor = (type, value) => {
    if (type === 'collection') {
      if (value >= 90) return 'bg-green-500';
      if (value >= 80) return 'bg-amber-500';
      return 'bg-red-500';
    }
    if (type === 'attendance') {
      if (value >= 85) return 'bg-green-500';
      if (value >= 75) return 'bg-amber-500';
      return 'bg-red-500';
    }
    return 'bg-primary';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {centers.map((center) => (
        <Card 
          key={center.id || center.center_id} 
          className={`flex flex-col bg-card border shadow-sm hover:shadow-md transition-shadow ${getCardBorderColor(center.health_status)}`}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="truncate font-semibold">{center.name}</span>
              {getHealthBadge(center.health_status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 text-sm">
            {/* Revenue */}
            <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">Doanh thu</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold tabular-nums">{formatCurrency(center.revenue)}</span>
                {center.revenue_change > 0 ? (
                  <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {center.revenue_change}%
                  </span>
                ) : center.revenue_change < 0 ? (
                  <span className="flex items-center text-xs font-medium text-red-600 dark:text-red-400">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {Math.abs(center.revenue_change)}%
                  </span>
                ) : null}
              </div>
            </div>

            {/* General Stats */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Học viên</span>
                <span className="font-medium tabular-nums">{center.student_count || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Lớp học</span>
                <span className="font-medium tabular-nums">{center.class_count || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Nhân sự</span>
                <span className="font-medium tabular-nums">{center.staff_count || 0}</span>
              </div>
            </div>

            {/* Rates with progress bars */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Tỷ lệ thu</span>
                  <span className="font-medium tabular-nums">{center.collection_rate || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressBarColor('collection', center.collection_rate || 0)}`} 
                    style={{ width: `${Math.min(100, Math.max(0, center.collection_rate || 0))}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Điểm danh</span>
                  <span className="font-medium tabular-nums">{center.attendance_rate || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressBarColor('attendance', center.attendance_rate || 0)}`} 
                    style={{ width: `${Math.min(100, Math.max(0, center.attendance_rate || 0))}%` }} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t mt-auto">
            <Link 
              to={`/admin/centers/${center.id || center.center_id}`} 
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center w-full justify-center transition-colors"
            >
              Xem chi tiết
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

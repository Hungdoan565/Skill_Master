import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function KPISummaryBar({ data }) {
  if (!data) return null;

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
  const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

  const renderTrendBadge = (change, inverseColors = false) => {
    if (change === undefined || change === null) return null;
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    // For debt, increasing is bad (red), decreasing is good (green)
    const positiveColor = inverseColors ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
    const negativeColor = inverseColors ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    const neutralColor = "text-muted-foreground";

    if (isPositive) {
      return (
        <Badge variant="outline" className={`ml-auto font-medium ${positiveColor}`}>
          <TrendingUp className="mr-1 h-3 w-3" />
          {change}%
        </Badge>
      );
    }
    if (isNegative) {
      return (
        <Badge variant="outline" className={`ml-auto font-medium ${negativeColor}`}>
          <TrendingDown className="mr-1 h-3 w-3" />
          {Math.abs(change)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className={`ml-auto font-medium ${neutralColor}`}>
        <Minus className="mr-1 h-3 w-3" />
        0%
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue Card */}
      <Card className="bg-white border shadow-sm border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col space-y-1">
            <CardDescription className="text-sm text-muted-foreground font-medium">Tổng doanh thu</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(data.revenue?.value)}
            </CardTitle>
          </div>
          {renderTrendBadge(data.revenue?.change)}
        </CardHeader>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">So với tháng trước</p>
        </CardFooter>
      </Card>

      {/* Students Card */}
      <Card className="bg-white border shadow-sm border-l-4 border-l-blue-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col space-y-1">
            <CardDescription className="text-sm text-muted-foreground font-medium">Tổng học viên</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatNumber(data.students?.value)}
            </CardTitle>
          </div>
          {renderTrendBadge(data.students?.change)}
        </CardHeader>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">Đang hoạt động</p>
        </CardFooter>
      </Card>

      {/* Classes Card */}
      <Card className="bg-white border shadow-sm border-l-4 border-l-purple-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col space-y-1">
            <CardDescription className="text-sm text-muted-foreground font-medium">Lớp đang học</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatNumber(data.classes?.value)}
            </CardTitle>
          </div>
          {data.classes?.change !== undefined && renderTrendBadge(data.classes?.change)}
        </CardHeader>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {data.classes?.total ? `Trên tổng ${data.classes.total} lớp` : "Lớp đang diễn ra"}
          </p>
        </CardFooter>
      </Card>

      {/* Debt Card */}
      <Card className="bg-white border shadow-sm border-l-4 border-l-red-500">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col space-y-1">
            <CardDescription className="text-sm text-muted-foreground font-medium">Công nợ</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(data.debt?.value)}
            </CardTitle>
          </div>
          {renderTrendBadge(data.debt?.change, true)}
        </CardHeader>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {data.debt?.overdue_invoices ? `${data.debt.overdue_invoices} hóa đơn quá hạn` : "Cần thu hồi"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

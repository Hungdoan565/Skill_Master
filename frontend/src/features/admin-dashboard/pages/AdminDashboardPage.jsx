import { useState } from 'react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { KPISummaryBar } from '../components/KPISummaryBar';
import { CenterHealthCards } from '../components/CenterHealthCards';
import { CrossCenterRevenueChart } from '../components/CrossCenterRevenueChart';
import { AnomalyAlertsWidget } from '../components/AnomalyAlertsWidget';
import { RecentActivitiesWidget } from '../components/RecentActivitiesWidget';
import { PendingApprovalsCard } from '../components/PendingApprovalsCard';
import { FinancialOverviewCard } from '../components/FinancialOverviewCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
export function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedRange, setSelectedRange] = useState('30_days');
  
  const { 
    systemStats, 
    centerHealth, 
    revenueTrend, 
    anomalies, 
    recentActivities, 
    dataWarnings,
    dataMeta,
    loading, 
    error, 
    refresh 
  } = useAdminDashboard(dateRange);

  const handleRangeChange = (value) => {
    setSelectedRange(value);
    
    const end = new Date();
    const start = new Date();
    
    switch (value) {
      case '7_days':
        start.setDate(end.getDate() - 7);
        break;
      case '30_days':
        start.setDate(end.getDate() - 30);
        break;
      case '3_months':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6_months':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1_year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  if (error && !systemStats) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Lỗi tải dữ liệu</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh} className="mt-3 bg-white hover:bg-slate-50">
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Tổng quan hệ thống</h1>
            <p className="text-muted-foreground mt-1">Dành cho Ban Giám Đốc (Super Admin)</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedRange} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7_days">7 ngày qua</SelectItem>
                <SelectItem value="30_days">30 ngày qua</SelectItem>
                <SelectItem value="3_months">3 tháng qua</SelectItem>
                <SelectItem value="6_months">6 tháng qua</SelectItem>
                <SelectItem value="1_year">1 năm qua</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refresh} 
              disabled={loading}
              title="Làm mới dữ liệu"
              className="bg-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading && !systemStats ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[120px] w-full rounded-xl bg-muted" />)}
            </div>
            <div className="w-full h-px bg-border my-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[250px] w-full rounded-xl bg-muted" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <Skeleton className="h-[400px] w-full rounded-xl bg-muted lg:col-span-2" />
              <Skeleton className="h-[400px] w-full rounded-xl bg-muted lg:col-span-1" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.isArray(dataWarnings) && dataWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-400/40 bg-amber-50/80 dark:bg-amber-900/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Dữ liệu chiến lược chưa đầy đủ</p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5">
                      {dataWarnings.slice(0, 4).map((warning, index) => (
                        <li key={`${warning.code || 'warn'}-${index}`}>{warning.message || warning.code}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <KPISummaryBar data={systemStats} />
            
            {/* Action Row - Pending Approvals & Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <PendingApprovalsCard />
              <FinancialOverviewCard data={systemStats} />
            </div>
            
            <div className="w-full h-px bg-border my-6" />
            
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Sức khỏe trung tâm</h2>
                <p className="text-sm text-muted-foreground">Đánh giá nhanh hiệu quả hoạt động của từng cơ sở</p>
              </div>
              <CenterHealthCards centers={centerHealth} />
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CrossCenterRevenueChart data={revenueTrend} />
              </div>
              <AnomalyAlertsWidget data={anomalies} />
            </div>
            
            <RecentActivitiesWidget activities={recentActivities} />

            {Object.keys(dataMeta || {}).length > 0 && (
              <p className="text-xs text-muted-foreground">
                Định nghĩa KPI: {dataMeta.systemDashboard?.definitionVersion || dataMeta.centerHealth?.definitionVersion || 'n/a'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;

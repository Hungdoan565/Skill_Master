/**
 * ManagerDashboardPage
 * Operational dashboard for CENTER_MANAGER role
 * Focus: daily center management, teacher status, room utilization, pending actions
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import useManagerDashboard from '../hooks/useManagerDashboard';
import { DollarSign, Users, BookOpen, AlertTriangle, RefreshCw, Download, Building2 } from 'lucide-react';

// Shared components (reused from admin dashboard)
import { StatCard } from '../components/StatCard';
import { RevenueBarChart } from '../components/RevenueBarChart';
import {
  DateRangeSelector,
  TodayScheduleCard,
  QuickActionsCard,
  ErrorAlert
} from '../components';
import { ActionableAlertsWidget } from '../components/ActionableAlertsWidget';

// Manager-specific widgets
import TeacherStatusWidget from '../components/TeacherStatusWidget';
import RoomUtilizationWidget from '../components/RoomUtilizationWidget';
import ClassFillRateWidget from '../components/ClassFillRateWidget';
import PendingActionsWidget from '../components/PendingActionsWidget';
import CenterKPIWidget from '../components/CenterKPIWidget';
import CollectionRateWidget from '../components/CollectionRateWidget';
import WeeklyAttendanceWidget from '../components/WeeklyAttendanceWidget';

import { exportDashboardToCSV } from '../utils';

// Helpers
const getValue = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object' && val.value !== undefined) return val.value;
  return val;
};

const getFormatted = (val) => {
  if (val === null || val === undefined) return '0đ';
  if (typeof val === 'object' && val.formatted !== undefined) return val.formatted;
  return val;
};

const getTrend = (val) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'object' && val.trend !== undefined) return val.trend;
  return undefined;
};

export default function ManagerDashboardPage() {
  const { user, session, profile, getCenterId } = useAuth();
  const accessToken = session?.access_token;
  const centerId = getCenterId?.();

  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const handleDateRangeChange = useCallback((range) => {
    setSelectedDateRange(range.key || range);
    if (range.startDate && range.endDate) {
      setDateRange({ startDate: range.startDate, endDate: range.endDate });
    } else {
      setDateRange({ startDate: null, endDate: null });
    }
  }, []);

  const {
    loading,
    error,
    stats,
    revenueChart,
    todaySchedule,
    alerts,
    teacherStatus,
    roomUtilization,
    classFillRates,
    pendingActions,
    collectionRate,
    weeklyAttendance,
    centerKPI,
    refresh,
    clearError,
  } = useManagerDashboard(accessToken, centerId, dateRange);

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Quản lý';
  const centerName = profile?.centers?.name || 'Trung tâm';

  const handleExport = () => {
    exportDashboardToCSV({ stats, revenueChart, todaySchedule }, dateRange);
  };

  // Stats data
  const revenue = stats?.revenue;
  const newStudents = stats?.newStudents;
  const activeClasses = stats?.activeClasses;
  const debt = stats?.debt;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">

        {/* ========== HEADER ========== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Xin chào, {userName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Tổng quan vận hành trung tâm {centerName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangeSelector
              selectedRange={selectedDateRange}
              onRangeChange={handleDateRangeChange}
            />

            {/* Center badge (read-only) */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700">
              <Building2 size={16} />
              <span className="text-sm font-medium">{centerName}</span>
            </div>

            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-border hover:bg-muted transition-colors disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl bg-white border border-border hover:bg-muted transition-colors"
              title="Xuất báo cáo"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onDismiss={clearError} />}

        {/* ========== ROW 1: KPI STAT CARDS ========== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Doanh thu"
            value={getFormatted(revenue)}
            rawValue={getValue(revenue)}
            trend={getTrend(revenue)}
            trendLabel="so với tháng trước"
            icon={DollarSign}
            iconColor="emerald"
            loading={loading}
            onClick={() => {}}
          />
          <StatCard
            title="Học viên mới"
            value={getValue(newStudents)}
            trend={getTrend(newStudents)}
            trendLabel="so với tháng trước"
            icon={Users}
            iconColor="blue"
            loading={loading}
            onClick={() => {}}
          />
          <StatCard
            title="Lớp đang hoạt động"
            value={getValue(activeClasses)}
            trend={getTrend(activeClasses)}
            trendLabel="so với tháng trước"
            icon={BookOpen}
            iconColor="violet"
            loading={loading}
            onClick={() => {}}
          />
          <StatCard
            title="Công nợ"
            value={getFormatted(debt)}
            rawValue={getValue(debt)}
            trend={getTrend(debt)}
            trendLabel="so với tháng trước"
            icon={AlertTriangle}
            iconColor="red"
            loading={loading}
            onClick={() => {}}
          />
        </div>

        {/* ========== ROW 2: KPI TARGETS + TEACHER STATUS ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <CenterKPIWidget targets={centerKPI} loading={loading} />
          <TeacherStatusWidget teachers={teacherStatus} loading={loading} />
        </div>

        {/* ========== ROW 3: REVENUE CHART + CLASS FILL RATE ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <RevenueBarChart data={revenueChart} loading={loading} />
          </div>
          <ClassFillRateWidget classes={classFillRates} loading={loading} />
        </div>

        {/* ========== ROW 4: SCHEDULE + ROOMS + PENDING ACTIONS ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <TodayScheduleCard data={todaySchedule} loading={loading} />
          <RoomUtilizationWidget
            rooms={roomUtilization?.rooms || []}
            summary={roomUtilization?.summary || {}}
            loading={loading}
          />
          <PendingActionsWidget
            categories={pendingActions?.categories || []}
            total={pendingActions?.total || 0}
            loading={loading}
          />
        </div>

        {/* ========== ROW 5: WEEKLY ATTENDANCE + COLLECTION RATE ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <WeeklyAttendanceWidget data={weeklyAttendance} loading={loading} />
          </div>
          <CollectionRateWidget data={collectionRate} loading={loading} />
        </div>

        {/* ========== ROW 6: QUICK ACTIONS + ALERTS ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <QuickActionsCard />
          <div className="lg:col-span-2">
            <ActionableAlertsWidget alerts={alerts} loading={loading} />
          </div>
        </div>

      </div>
    </div>
  );
}

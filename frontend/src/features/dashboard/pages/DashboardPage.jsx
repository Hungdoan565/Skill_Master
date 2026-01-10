/**
 * DashboardPage V2
 * Complete redesign based on Dribbble references
 * Layout: KPI Row → Charts Row → Table + Widgets Row
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useDashboard } from '../hooks';
import { DollarSign, Users, BookOpen, AlertTriangle, RefreshCw, Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Default goals (fallback if settings not available)
const DEFAULT_GOALS = {
  revenueGoal: 200000000,
  studentsGoal: 50
};

// New V2 Components
import { StatCard } from '../components/StatCard';
import { RevenueBarChart } from '../components/RevenueBarChart';
import { DistributionDonut } from '../components/DistributionDonut';
import { EnrollmentsTable } from '../components/EnrollmentsTable';
import { GoalProgressWidget } from '../components/GoalProgressWidget';
import { TopTeachersWidget } from '../components/TopTeachersWidget';

// Existing Components
import {
  CenterSelector,
  DateRangeSelector,
  TodayScheduleCard,
  QuickActionsCard,
  ErrorAlert
} from '../components';
import { ActionableAlertsWidget } from '../components/ActionableAlertsWidget';
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

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, session, profile, isSuperAdmin } = useAuth();
  const accessToken = session?.access_token;

  const [selectedCenterId, setSelectedCenterId] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [dateRange, setDateRange] = useState(() => {
    // Initialize with this_month dates
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now
    };
  });

  const handleDateRangeChange = useCallback((rangeId, dates) => {
    setSelectedDateRange(rangeId);
    if (dates) {
      setDateRange(dates);
    }
  }, []);

  const {
    loading,
    refreshing,
    error,
    stats,
    revenueChart,
    recentStudents,
    courseDistribution,
    paymentOverview,
    todaySchedule,
    fetchDashboardData,
    refresh,
    clearError
  } = useDashboard(accessToken, selectedCenterId, dateRange);

  // State for top teachers
  const [topTeachers, setTopTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

  // State for dashboard goals (from settings)
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  // Fetch dashboard goals from settings
  const fetchGoals = useCallback(async () => {
    if (!accessToken) return;

    try {
      const centerParam = selectedCenterId ? `?centerId=${selectedCenterId}` : '';
      const response = await fetch(
        `${API_URL}/api/admin/settings/dashboard_goals${centerParam}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();

      if (data.success && data.data?.value) {
        setGoals({
          revenueGoal: data.data.value.revenueGoal || DEFAULT_GOALS.revenueGoal,
          studentsGoal: data.data.value.studentsGoal || DEFAULT_GOALS.studentsGoal
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard goals:', error);
      // Keep default goals on error
    }
  }, [accessToken, selectedCenterId]);

  // Fetch top teachers
  const fetchTopTeachers = useCallback(async () => {
    if (!accessToken) return;

    try {
      setTeachersLoading(true);
      const centerParam = selectedCenterId ? `?centerId=${selectedCenterId}` : '';
      const response = await fetch(
        `${API_URL}/api/dashboard/teacher-performance${centerParam}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();

      if (data.success) {
        // Transform to widget format
        const teachers = data.data.map(t => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          students: t.student_count,
          rating: null // No rating system yet
        }));
        setTopTeachers(teachers);
      }
    } catch (error) {
      console.error('Error fetching top teachers:', error);
      setTopTeachers([]);
    } finally {
      setTeachersLoading(false);
    }
  }, [accessToken, selectedCenterId]);

  useEffect(() => {
    fetchDashboardData();
    fetchTopTeachers();
    fetchGoals();
  }, [fetchDashboardData, fetchTopTeachers, fetchGoals, selectedCenterId, dateRange]);

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';

  const handleExport = () => {
    exportDashboardToCSV({ stats, revenueChart, courseDistribution, recentStudents, paymentOverview, todaySchedule }, dateRange);
  };

  // Stats data
  const revenue = stats?.revenue;
  const newStudents = stats?.newStudents;
  const activeClasses = stats?.activeClasses;
  const debt = stats?.debt;

  // Transform recent students for table
  const enrollmentsData = (recentStudents || []).map(student => ({
    ...student,
    student_name: student.name || student.full_name,
    status: student.status || 'pending' // Use status from API
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">

        {/* ========== HEADER ========== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Welcome */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Xin chào, {userName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Đây là tổng quan hoạt động của trung tâm hôm nay
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeSelector
              selectedRange={selectedDateRange}
              onRangeChange={handleDateRangeChange}
            />

            {isSuperAdmin?.() && (
              <CenterSelector
                selectedCenterId={selectedCenterId}
                onCenterChange={setSelectedCenterId}
                accessToken={accessToken}
              />
            )}

            <button
              onClick={() => refresh()}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleExport}
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
              title="Xuất báo cáo"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        <ErrorAlert message={error} onRetry={refresh} onDismiss={clearError} />

        {/* ========== KPI ROW ========== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Tổng doanh thu"
            value={getFormatted(revenue)}
            trend={getTrend(revenue)}
            trendLabel="so với tháng trước"
            icon={DollarSign}
            iconColor="orange"
            loading={loading}
            onClick={() => navigate('/admin/invoices?status=paid')}
          />
          <StatCard
            title="Học viên ghi danh"
            value={getValue(newStudents)}
            trend={getTrend(newStudents)}
            trendLabel="so với tháng trước"
            icon={Users}
            iconColor="emerald"
            loading={loading}
            onClick={() => navigate('/admin/students')}
          />
          <StatCard
            title="Lớp đang hoạt động"
            value={getValue(activeClasses)}
            trend={getTrend(activeClasses)}
            icon={BookOpen}
            iconColor="blue"
            loading={loading}
            onClick={() => navigate('/admin/classes?status=active')}
          />
          <StatCard
            title="Công nợ cần thu"
            value={getFormatted(debt)}
            trend={undefined}
            trendLabel={`${paymentOverview?.counts?.overdue || 0} hóa đơn quá hạn`}
            icon={AlertTriangle}
            iconColor="red"
            loading={loading}
            onClick={() => navigate('/admin/invoices?status=overdue')}
          />
        </div>

        {/* ========== GOAL + TOP TEACHERS ROW ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <GoalProgressWidget
            revenueGoal={goals.revenueGoal}
            studentsGoal={goals.studentsGoal}
            currentRevenue={getValue(revenue) || 0}
            currentStudents={getValue(newStudents) || 0}
            loading={loading}
          />
          <TopTeachersWidget teachers={topTeachers} loading={teachersLoading} />
        </div>

        {/* ========== CHARTS ROW ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <RevenueBarChart data={revenueChart} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            <DistributionDonut data={courseDistribution} loading={loading} />
          </div>
        </div>

        {/* ========== TABLE + WIDGETS ROW ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Enrollments Table - 2 columns */}
          <div className="lg:col-span-2">
            <EnrollmentsTable data={enrollmentsData} loading={loading} />
          </div>

          {/* Right Column - Schedule + Quick Actions */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <TodayScheduleCard data={todaySchedule} loading={loading} />
            <QuickActionsCard />
          </div>
        </div>

        {/* ========== ALERTS ROW ========== */}
        <ActionableAlertsWidget centerId={selectedCenterId} />

      </div>
    </div>
  );
}

export default DashboardPage;

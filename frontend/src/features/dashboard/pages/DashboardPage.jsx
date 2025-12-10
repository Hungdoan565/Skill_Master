/**
 * DashboardPage Component
 * Trang tổng quan admin - UPGRADED version
 * - Thêm error handling
 * - Thêm widgets mới (Payment, Today Schedule)
 * - Thêm center selector cho SUPER_ADMIN
 * - Responsive layout cải tiến
 * - Date range filtering
 * - Export functionality
 * - Activity stream (optional)
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useDashboard } from '../hooks';
import { exportDashboardToCSV } from '../utils';
import {
  DashboardHeader,
  StatsSection,
  ChartsSection,
  RecentStudentsList,
  QuickActionsCard,
  PaymentOverviewCard,
  TodayScheduleCard,
  ErrorAlert,
  CenterSelector,
  DateRangeSelector,
  GettingStartedCard
} from '../components';

export function DashboardPage() {
  const { user, session, profile, isSuperAdmin } = useAuth();
  const accessToken = session?.access_token;

  // State for center filtering (SUPER_ADMIN only)
  const [selectedCenterId, setSelectedCenterId] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [dateRangeValues, setDateRangeValues] = useState(null);

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
  } = useDashboard(accessToken, selectedCenterId);

  // Fetch data on mount and when center changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get user name for greeting
  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];

  // Handle center change
  const handleCenterChange = (centerId) => {
    setSelectedCenterId(centerId);
  };

  // Handle date range change
  const handleDateRangeChange = (rangeId, rangeValues) => {
    setSelectedDateRange(rangeId);
    setDateRangeValues(rangeValues);
    // Will trigger re-fetch via useEffect when implemented
  };

  // Handle export
  const handleExport = () => {
    const exportData = {
      stats,
      revenueChart,
      courseDistribution,
      recentStudents,
      paymentOverview,
      todaySchedule
    };
    exportDashboardToCSV(exportData);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Center Selector and Date Range */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <DashboardHeader
            userName={userName}
            onRefresh={refresh}
            onExport={handleExport}
            refreshing={refreshing}
          />

          {/* Filters - Center Selector and Date Range */}
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeSelector
              selectedRange={selectedDateRange}
              onRangeChange={handleDateRangeChange}
            />

            {isSuperAdmin?.() && (
              <CenterSelector
                selectedCenterId={selectedCenterId}
                onCenterChange={handleCenterChange}
                accessToken={accessToken}
              />
            )}
          </div>
        </div>

        {/* Error Alert */}
        <ErrorAlert
          message={error}
          onRetry={refresh}
          onDismiss={clearError}
        />

        {/* Getting Started Card - Chỉ hiện khi là admin mới */}
        {stats && (
          <div className="mb-8">
            <GettingStartedCard
              completedSteps={{
                hasCenter: stats?.summary?.totalCenters > 0,
                hasStaff: stats?.summary?.totalTeachers > 0,
                hasCourses: stats?.summary?.totalCourses > 0,
                hasClasses: (stats?.activeClasses?.value || 0) > 0,
                hasStudents: (stats?.newStudents?.value || 0) > 0,
              }}
            />
          </div>
        )}

        {/* Stats Section */}
        <div className="mb-8">
          <StatsSection stats={stats} loading={loading} />
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <ChartsSection
            revenueData={revenueChart}
            distributionData={courseDistribution}
            loading={loading}
          />
        </div>

        {/* Middle Section: Payment Overview + Today Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PaymentOverviewCard
            data={paymentOverview}
            loading={loading}
          />
          <TodayScheduleCard
            data={todaySchedule}
            loading={loading}
          />
        </div>

        {/* Bottom Section: Recent Students + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentStudentsList
              students={recentStudents}
              loading={loading}
            />
          </div>
          <div>
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

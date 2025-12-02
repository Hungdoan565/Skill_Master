/**
 * DashboardPage Component
 * Trang tổng quan admin - refactored version
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useDashboard } from '../hooks';
import {
  DashboardHeader,
  StatsSection,
  ChartsSection,
  RecentStudentsList,
  QuickActionsCard
} from '../components';

export function DashboardPage() {
  const { user, session } = useAuth();
  const accessToken = session?.access_token;

  const {
    loading,
    refreshing,
    stats,
    revenueChart,
    recentStudents,
    courseDistribution,
    fetchDashboardData,
    refresh
  } = useDashboard(accessToken);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get user name for greeting
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <DashboardHeader
          userName={userName}
          onRefresh={refresh}
          refreshing={refreshing}
        />

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

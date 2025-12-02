/**
 * useDashboard Hook - Quản lý data cho dashboard
 */

import { useState, useCallback } from 'react';
import { API_URL } from '../utils';

/**
 * Hook quản lý dashboard data
 * @param {string} accessToken - Token xác thực
 */
export function useDashboard(accessToken) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [courseDistribution, setCourseDistribution] = useState([]);

  // API headers
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }), [accessToken]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (!accessToken) return;
    
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch all data in parallel
      const [statsRes, revenueRes, studentsRes, distributionRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/dashboard/revenue-chart`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/dashboard/recent-students?limit=5`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/dashboard/course-distribution`, { headers: getHeaders() })
      ]);

      const [statsData, revenueData, studentsData, distributionData] = await Promise.all([
        statsRes.json(),
        revenueRes.json(),
        studentsRes.json(),
        distributionRes.json()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (revenueData.success) setRevenueChart(revenueData.data);
      if (studentsData.success) setRecentStudents(studentsData.data);
      if (distributionData.success) setCourseDistribution(distributionData.data);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, getHeaders]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    loading,
    refreshing,
    stats,
    revenueChart,
    recentStudents,
    courseDistribution,
    fetchDashboardData,
    refresh
  };
}

export default useDashboard;

/**
 * useDashboard Hook - Quản lý data cho dashboard
 * UPGRADED: Thêm error handling, unified API, payment & attendance stats
 */

import { useState, useCallback } from 'react';
import { API_URL } from '../utils';

/**
 * Hook quản lý dashboard data
 * @param {string} accessToken - Token xác thực
 * @param {string} centerId - Optional center ID for filtering
 */
export function useDashboard(accessToken, centerId = null) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Main stats
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [courseDistribution, setCourseDistribution] = useState([]);

  // New: Additional widgets data
  const [paymentOverview, setPaymentOverview] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // API headers
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }), [accessToken]);

  // Build query string with optional centerId
  const buildQuery = useCallback((params = {}) => {
    const query = new URLSearchParams();
    if (centerId) query.append('centerId', centerId);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query.append(key, value);
      }
    });
    return query.toString() ? `?${query.toString()}` : '';
  }, [centerId]);

  // Fetch all dashboard data using unified API
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (!accessToken) return;

    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Use unified API for main data (reduces API calls from 4 to 1)
      const [allDataRes, revenueRes, distributionRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/all${buildQuery()}`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/dashboard/revenue-chart${buildQuery()}`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/dashboard/course-distribution${buildQuery()}`, { headers: getHeaders() })
      ]);

      // Check for HTTP errors
      if (!allDataRes.ok || !revenueRes.ok || !distributionRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [allData, revenueData, distributionData] = await Promise.all([
        allDataRes.json(),
        revenueRes.json(),
        distributionRes.json()
      ]);

      if (allData.success) {
        setStats(allData.data.stats);
        setPaymentOverview(allData.data.payments);
        setRecentStudents(allData.data.recentStudents || []);
        setTodaySchedule(allData.data.todaySchedule);
      }

      if (revenueData.success) setRevenueChart(revenueData.data);
      if (distributionData.success) setCourseDistribution(distributionData.data);

      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, getHeaders, buildQuery]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    refreshing,
    error,
    lastUpdated,

    // Data
    stats,
    revenueChart,
    recentStudents,
    courseDistribution,
    paymentOverview,
    todaySchedule,

    // Actions
    fetchDashboardData,
    refresh,
    clearError
  };
}

export default useDashboard;

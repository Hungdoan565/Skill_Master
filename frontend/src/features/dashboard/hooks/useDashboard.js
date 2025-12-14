/**
 * useDashboard Hook - Quản lý data cho dashboard
 * UPGRADED: 
 * - Error handling
 * - Unified API
 * - Payment & attendance stats
 * - CACHE with stale-while-revalidate pattern for instant loading
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { API_URL } from '../utils';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

/**
 * Hook quản lý dashboard data
 * @param {string} accessToken - Token xác thực
 * @param {string} centerId - Optional center ID for filtering
 */
export function useDashboard(accessToken, centerId = null) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // Main stats
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [courseDistribution, setCourseDistribution] = useState([]);

  // New: Additional widgets data
  const [paymentOverview, setPaymentOverview] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Cache key based on centerId
  const cacheKey = CACHE_KEYS.dashboard(centerId);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

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

  // Apply cached data to state
  const applyCachedData = useCallback((cachedData) => {
    if (!cachedData) return false;

    setStats(cachedData.stats);
    setPaymentOverview(cachedData.paymentOverview);
    setRecentStudents(cachedData.recentStudents || []);
    setTodaySchedule(cachedData.todaySchedule);
    setRevenueChart(cachedData.revenueChart || []);
    setCourseDistribution(cachedData.courseDistribution || []);
    setLastUpdated(cachedData.lastUpdated);

    return true;
  }, []);

  // Fetch all dashboard data using unified API
  const fetchDashboardData = useCallback(async (showRefreshing = false, skipCache = false) => {
    if (!accessToken) return;

    // ====== STALE-WHILE-REVALIDATE PATTERN ======
    // 1. Check cache first
    if (!skipCache) {
      const { data: cachedData, isStale, isMiss } = cache.getWithStale(cacheKey);

      if (!isMiss) {
        // Show cached data immediately
        applyCachedData(cachedData);
        setLoading(false);

        // If not stale, we're done
        if (!isStale) {
          return;
        }
        // If stale, continue to fetch fresh data in background
        showRefreshing = true;
      }
    }

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

      if (!isMounted.current) return;

      const newData = {
        stats: null,
        paymentOverview: null,
        recentStudents: [],
        todaySchedule: null,
        revenueChart: [],
        courseDistribution: [],
        lastUpdated: new Date()
      };

      if (allData.success) {
        newData.stats = allData.data.stats;
        newData.paymentOverview = allData.data.payments;
        newData.recentStudents = allData.data.recentStudents || [];
        newData.todaySchedule = allData.data.todaySchedule;

        setStats(newData.stats);
        setPaymentOverview(newData.paymentOverview);
        setRecentStudents(newData.recentStudents);
        setTodaySchedule(newData.todaySchedule);
      }

      if (revenueData.success) {
        newData.revenueChart = revenueData.data;
        setRevenueChart(newData.revenueChart);
      }

      if (distributionData.success) {
        newData.courseDistribution = distributionData.data;
        setCourseDistribution(newData.courseDistribution);
      }

      setLastUpdated(newData.lastUpdated);

      // ====== SAVE TO CACHE ======
      cache.set(cacheKey, newData, CACHE_TTL.MEDIUM);

    } catch (err) {
      console.error('Error fetching dashboard:', err);
      if (isMounted.current) {
        setError(err.message || 'Không thể tải dữ liệu dashboard');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [accessToken, getHeaders, buildQuery, cacheKey, applyCachedData]);

  // Refresh data (skip cache)
  const refresh = useCallback(() => {
    fetchDashboardData(true, true);
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

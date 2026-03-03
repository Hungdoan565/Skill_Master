import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useAdminDashboard(dateRange = null) {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataWarnings, setDataWarnings] = useState([]);
  const [dataMeta, setDataMeta] = useState({});
  
  const [systemStats, setSystemStats] = useState(null);
  const [centerHealth, setCenterHealth] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [anomalies, setAnomalies] = useState({ anomalies: [], all_stable: true });
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    setDataWarnings([]);

    try {
      const query = new URLSearchParams();
      if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
      const queryString = query.toString() ? `?${query.toString()}` : '';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };

      const endpointConfigs = [
        { key: 'systemDashboard', label: 'Tổng quan hệ thống', url: `${API_URL}/api/admin/system-dashboard${queryString}` },
        { key: 'centerHealth', label: 'Sức khỏe trung tâm', url: `${API_URL}/api/admin/center-health${queryString}` },
        { key: 'revenueTrend', label: 'Xu hướng doanh thu', url: `${API_URL}/api/admin/revenue-trend${queryString}` },
        { key: 'anomalies', label: 'Cảnh báo bất thường', url: `${API_URL}/api/admin/anomalies${queryString}` },
        { key: 'auditLogs', label: 'Nhật ký hệ thống', url: `${API_URL}/api/admin/audit-logs?limit=10` },
      ];

      const endpointResults = await Promise.all(
        endpointConfigs.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url, { headers });
            const payload = await response.json().catch(() => null);

            return {
              ...endpoint,
              ok: response.ok && payload?.success,
              status: response.status,
              payload,
            };
          } catch (fetchError) {
            return {
              ...endpoint,
              ok: false,
              status: null,
              payload: null,
              error: fetchError.message,
            };
          }
        })
      );

      const mergedWarnings = [];
      const endpointMeta = {};

      const successfulResults = endpointResults.filter((result) => result.ok);
      if (successfulResults.length === 0) {
        throw new Error('Không thể tải dữ liệu dashboard từ các nguồn chiến lược');
      }

      endpointResults.forEach((result) => {
        if (result.ok) {
          if (result.payload?.meta) {
            endpointMeta[result.key] = result.payload.meta;
            if (Array.isArray(result.payload.meta.warnings) && result.payload.meta.warnings.length > 0) {
              mergedWarnings.push(
                ...result.payload.meta.warnings.map((warning) => ({
                  ...warning,
                  source: result.key,
                }))
              );
            }
          }
          return;
        }

        mergedWarnings.push({
          code: `${result.key.toUpperCase()}_UNAVAILABLE`,
          message: `${result.label} tạm thời không khả dụng`,
          details: {
            status: result.status,
            error: result.error || result.payload?.error || result.payload?.message || 'Unknown error',
          },
          source: result.key,
        });
      });

      const statsResult = endpointResults.find((result) => result.key === 'systemDashboard');
      const healthResult = endpointResults.find((result) => result.key === 'centerHealth');
      const revenueResult = endpointResults.find((result) => result.key === 'revenueTrend');
      const anomaliesResult = endpointResults.find((result) => result.key === 'anomalies');
      const activitiesResult = endpointResults.find((result) => result.key === 'auditLogs');
      const healthData = healthResult?.ok ? healthResult.payload.data || [] : [];

      const drilldownChecks = {
        system_to_center: healthData.length > 0 && healthData.every((center) => Boolean(center.center_id || center.id)),
        center_to_class: healthData.length > 0 && healthData.every((center) => typeof center.class_count === 'number'),
      };

      if (!drilldownChecks.system_to_center) {
        mergedWarnings.push({
          code: 'DRILLDOWN_SYSTEM_CENTER_MISSING',
          message: 'Thiếu dữ liệu drill-down hệ thống -> trung tâm trong feed center-health',
          source: 'centerHealth',
        });
      }

      if (!drilldownChecks.center_to_class) {
        mergedWarnings.push({
          code: 'DRILLDOWN_CENTER_CLASS_MISSING',
          message: 'Thiếu dữ liệu drill-down trung tâm -> lớp học trong feed center-health',
          source: 'centerHealth',
        });
      }

      setSystemStats(
        statsResult?.ok
          ? statsResult.payload.data
          : {
              revenue: { value: 0, change: 0, unavailable: true },
              students: { value: 0, change: 0, unavailable: true },
              classes: { value: 0, unavailable: true },
              debt: { value: 0, change: 0, unavailable: true },
            }
      );
      setCenterHealth(healthData);
      setRevenueTrend(revenueResult?.ok ? revenueResult.payload.data || [] : []);
      setAnomalies(
        anomaliesResult?.ok
          ? anomaliesResult.payload.data
          : {
              anomalies: [],
              all_stable: true,
              lifecycle_states: [],
            }
      );
      setRecentActivities(activitiesResult?.ok ? activitiesResult.payload.data?.logs || [] : []);
      setDataWarnings(mergedWarnings);
      setDataMeta({
        ...endpointMeta,
        drilldownChecks,
      });

      if (mergedWarnings.length === 0) {
        setError(null);
      }

    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.message || 'Không thể tải dữ liệu tổng quan hệ thống');
    } finally {
      setLoading(false);
    }
  }, [accessToken, dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    systemStats,
    centerHealth,
    revenueTrend,
    anomalies,
    recentActivities,
    dataWarnings,
    dataMeta,
    loading,
    error,
    refresh: fetchDashboardData
  };
}

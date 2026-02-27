import { useState, useCallback, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function formatDateForAPI(date) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildQuery(centerId, dateRange) {
  const params = new URLSearchParams();
  if (centerId) params.set('centerId', centerId);
  if (dateRange?.startDate) params.set('startDate', formatDateForAPI(dateRange.startDate));
  if (dateRange?.endDate) params.set('endDate', formatDateForAPI(dateRange.endDate));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export default function useManagerDashboard(accessToken, centerId, dateRange) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Existing dashboard data
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [alerts, setAlerts] = useState(null);

  // Manager-specific data
  const [teacherStatus, setTeacherStatus] = useState([]);
  const [roomUtilization, setRoomUtilization] = useState({ rooms: [], summary: {} });
  const [classFillRates, setClassFillRates] = useState([]);
  const [pendingActions, setPendingActions] = useState({ categories: [], total: 0 });
  const [collectionRate, setCollectionRate] = useState({});
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [centerKPI, setCenterKPI] = useState([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  const safeFetch = useCallback(async (url) => {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }, [accessToken]);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const query = buildQuery(centerId, dateRange);

      const [
        dashAll,
        revenue,
        alertsData,
        teachers,
        rooms,
        fills,
        pending,
        collection,
        attendance,
        goals,
      ] = await Promise.all([
        safeFetch(`${API_URL}/api/dashboard/all${query}`),
        safeFetch(`${API_URL}/api/dashboard/revenue-chart${query}`),
        safeFetch(`${API_URL}/api/dashboard/alerts${query}`),
        safeFetch(`${API_URL}/api/dashboard/teacher-status-today${query}`),
        safeFetch(`${API_URL}/api/dashboard/room-utilization${query}`),
        safeFetch(`${API_URL}/api/dashboard/class-fill-rates${query}`),
        safeFetch(`${API_URL}/api/dashboard/pending-actions${query}`),
        safeFetch(`${API_URL}/api/dashboard/collection-rate${query}`),
        safeFetch(`${API_URL}/api/dashboard/attendance-overview${query}`),
        safeFetch(`${API_URL}/api/admin/settings/dashboard_goals${query}`),
      ]);

      if (!isMounted.current) return;

      if (dashAll) {
        setStats(dashAll.stats || null);
        setTodaySchedule(dashAll.todaySchedule || []);
      }
      if (revenue) setRevenueChart(revenue.chartData || revenue || []);
      if (alertsData) setAlerts(alertsData);
      if (teachers) setTeacherStatus(teachers);
      if (rooms) setRoomUtilization(rooms);
      if (fills) setClassFillRates(fills);
      if (pending) setPendingActions(pending);
      if (collection) setCollectionRate(collection);

      // Weekly attendance from attendance-overview
      if (attendance?.dailyBreakdown) {
        setWeeklyAttendance(attendance.dailyBreakdown.slice(-7).map(d => ({
          day: new Date(d.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
          label: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          rate: d.present_count && d.total_count
            ? Math.round((d.present_count / d.total_count) * 100)
            : 0,
        })));
      }

      // Center KPI from goals
      if (goals) {
        const kpis = [];
        if (goals.revenue_goal) {
          kpis.push({ label: 'Doanh thu', current: dashAll?.stats?.totalRevenue || 0, target: goals.revenue_goal, type: 'currency' });
        }
        if (goals.students_goal) {
          kpis.push({ label: 'Học viên mới', current: dashAll?.stats?.newStudents || 0, target: goals.students_goal, type: 'number' });
        }
        if (attendance?.overallRate !== undefined) {
          kpis.push({ label: 'Tỷ lệ điểm danh', current: Math.round(attendance.overallRate), target: 90, type: 'percentage' });
        }
        setCenterKPI(kpis);
      }

      setLastUpdated(new Date());
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [accessToken, centerId, dateRange, safeFetch]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    lastUpdated,
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
    clearError: () => setError(null),
  };
}

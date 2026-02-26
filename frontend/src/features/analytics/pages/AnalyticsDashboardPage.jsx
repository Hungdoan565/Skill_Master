import { useEffect, useMemo, useState } from 'react';
import { ChartSpline, Users, RotateCcw, Wallet } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const VND_FORMATTER = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');
const PIE_COLORS = ['#16a34a', '#e5e7eb'];

function formatMonthLabel(monthText) {
  if (!monthText || !monthText.includes('-')) return monthText || '';
  const [year, month] = monthText.split('-');
  return `${month}/${year}`;
}

function getMonthRange(months) {
  const now = new Date();
  const toDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromDate = new Date(toDate.getFullYear(), toDate.getMonth() - (months - 1), 1);

  const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return {
    from: format(fromDate),
    to: format(toDate),
  };
}

function LoadingBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

function StatCard({ title, value, icon: Icon, toneClass }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboardPage() {
  const { session } = useAuth();
  const [range, setRange] = useState('12m');
  const [loading, setLoading] = useState(true);
  const [enrollmentTrend, setEnrollmentTrend] = useState([]);
  const [retention, setRetention] = useState({ retention_rate: 0, total_completed: 0, total_re_enrolled: 0 });
  const [revenueForecast, setRevenueForecast] = useState([]);

  const rangeOptions = [
    { value: '6m', label: '6 tháng gần nhất', months: 6 },
    { value: '12m', label: '12 tháng gần nhất', months: 12 },
    { value: '24m', label: '24 tháng gần nhất', months: 24 },
  ];

  const currentRange = useMemo(() => rangeOptions.find((item) => item.value === range) || rangeOptions[1], [range]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session?.access_token) return;

      setLoading(true);
      try {
        const rangeValues = getMonthRange(currentRange.months);
        const currentYear = new Date().getFullYear();

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        };

        const [enrollmentsRes, retentionRes, forecastRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/enrollments?from=${rangeValues.from}&to=${rangeValues.to}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/retention?year=${currentYear}`, { headers }),
          fetch(`${API_URL}/api/admin/analytics/revenue-forecast`, { headers }),
        ]);

        const [enrollmentsJson, retentionJson, forecastJson] = await Promise.all([
          enrollmentsRes.json(),
          retentionRes.json(),
          forecastRes.json(),
        ]);

        if (!enrollmentsJson.success) {
          throw new Error(enrollmentsJson.message || 'Không thể tải dữ liệu ghi danh');
        }
        if (!retentionJson.success) {
          throw new Error(retentionJson.message || 'Không thể tải dữ liệu giữ chân');
        }
        if (!forecastJson.success) {
          throw new Error(forecastJson.message || 'Không thể tải dữ liệu dự báo doanh thu');
        }

        setEnrollmentTrend(enrollmentsJson.data || []);
        setRetention(retentionJson.data || { retention_rate: 0, total_completed: 0, total_re_enrolled: 0 });
        setRevenueForecast(forecastJson.data || []);
      } catch (error) {
        console.error('Error loading analytics dashboard:', error);
        toast.error(error.message || 'Không thể tải dữ liệu phân tích nâng cao');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [API_URL, currentRange.months, session]);

  const enrollmentThisMonth = useMemo(() => {
    if (!enrollmentTrend.length) return 0;
    return enrollmentTrend[enrollmentTrend.length - 1]?.count || 0;
  }, [enrollmentTrend]);

  const forecastThisMonth = useMemo(() => {
    if (!revenueForecast.length) return 0;
    return revenueForecast[0]?.projected_revenue || 0;
  }, [revenueForecast]);

  const retentionPieData = useMemo(() => {
    const retained = Number(retention.total_re_enrolled) || 0;
    const total = Number(retention.total_completed) || 0;
    const churn = Math.max(total - retained, 0);
    return [
      { name: 'Giữ chân', value: retained },
      { name: 'Không quay lại', value: churn },
    ];
  }, [retention]);

  const enrollmentLineData = useMemo(() => {
    return (enrollmentTrend || []).map((item) => ({
      ...item,
      monthLabel: formatMonthLabel(item.month),
    }));
  }, [enrollmentTrend]);

  const revenueBarData = useMemo(() => {
    return (revenueForecast || []).map((item) => ({
      ...item,
      monthLabel: formatMonthLabel(item.month),
    }));
  }, [revenueForecast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <ChartSpline className="h-6 w-6 text-sky-600" />
              Phân tích nâng cao
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi xu hướng ghi danh, tỷ lệ giữ chân và dự báo doanh thu</p>
          </div>
          <div className="w-full md:w-[240px]">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent>
                {rangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <>
              <LoadingBlock className="h-28" />
              <LoadingBlock className="h-28" />
              <LoadingBlock className="h-28" />
            </>
          ) : (
            <>
              <StatCard
                title="Tổng đăng ký (tháng này)"
                value={NUMBER_FORMATTER.format(enrollmentThisMonth)}
                icon={Users}
                toneClass="bg-sky-50 text-sky-600"
              />
              <StatCard
                title="Tỷ lệ giữ chân"
                value={`${NUMBER_FORMATTER.format(retention.retention_rate || 0)}%`}
                icon={RotateCcw}
                toneClass="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                title="Doanh thu dự kiến"
                value={VND_FORMATTER.format(forecastThisMonth)}
                icon={Wallet}
                toneClass="bg-amber-50 text-amber-600"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Xu hướng đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingBlock className="h-[340px]" />
              ) : (
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentLineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="monthLabel" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value) => NUMBER_FORMATTER.format(Number(value) || 0)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Số ghi danh"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tỷ lệ giữ chân học viên</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingBlock className="h-[340px]" />
              ) : (
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={retentionPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {retentionPieData.map((entry, index) => (
                          <Cell key={`retention-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => NUMBER_FORMATTER.format(Number(value) || 0)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Dự báo doanh thu 3 tháng</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingBlock className="h-[320px]" />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="monthLabel" />
                      <YAxis tickFormatter={(v) => `${Math.round((Number(v) || 0) / 1000000)}M`} />
                      <Tooltip formatter={(value) => VND_FORMATTER.format(Number(value) || 0)} />
                      <Legend />
                      <Bar dataKey="projected_revenue" name="Doanh thu dự kiến" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

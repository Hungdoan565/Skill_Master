import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { exportToExcel } from '@/lib/export-utils';
import { useCenters } from '@/features/centers';
import { useFinanceSummary } from '../hooks/useFinanceSummary';

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatCurrency(value) {
  return `${(value || 0).toLocaleString('vi-VN')}đ`;
}

function LoadingBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

function OverviewCard({ title, value, tintClass }) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: tintClass }}>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(value)}</p>
      </CardContent>
    </Card>
  );
}

export function FinancialDashboardPage() {
  const { isSuperAdmin, isManager, getCenterId, profile } = useAuth();
  const { centers, fetchCenters } = useCenters();

  const now = new Date();
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [centerId, setCenterId] = useState('');

  useEffect(() => {
    if (isManager?.()) {
      setCenterId(getCenterId?.() || '');
    }
  }, [isManager, getCenterId]);

  useEffect(() => {
    if (isSuperAdmin?.()) {
      fetchCenters({ withStats: false });
    }
  }, [isSuperAdmin, fetchCenters]);

  const { data, loading, error, refetch } = useFinanceSummary({
    centerId,
    period,
    year,
    month,
  });

  const paymentMethodData = useMemo(() => {
    return (data?.payment_methods || []).map((item) => ({
      ...item,
      name: item.method,
      value: item.total,
    }));
  }, [data?.payment_methods]);

  const centerName = profile?.centers?.name || 'Skill Master';
  const revenueColumns = [
    { key: 'month', header: 'Tháng' },
    { key: 'revenue', header: 'Doanh thu' },
    { key: 'paid', header: 'Đã thu' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Tổng quan tài chính
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi doanh thu, công nợ và hiệu quả khóa học</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin?.() && (
              <select
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Tất cả trung tâm</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="month">Tháng</option>
              <option value="quarter">Quý</option>
              <option value="year">Năm</option>
            </select>

            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))}
              className="h-10 w-24 rounded-md border bg-background px-3 text-sm"
            />

            {period !== 'year' && (
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{`Tháng ${m}`}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={refetch}
              className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => exportToExcel(data?.monthly_revenue || [], revenueColumns, 'bao-cao-doanh-thu', centerName)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        {error && (
          <Card>
            <CardContent className="pt-6 text-sm text-red-600">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <>
              <LoadingBlock className="h-28" />
              <LoadingBlock className="h-28" />
              <LoadingBlock className="h-28" />
              <LoadingBlock className="h-28" />
            </>
          ) : (
            <>
              <OverviewCard title="Tổng doanh thu" value={data?.overview?.total_revenue} tintClass="#2563eb" />
              <OverviewCard title="Đã thu" value={data?.overview?.total_paid} tintClass="#16a34a" />
              <OverviewCard title="Chưa thu" value={data?.overview?.total_pending} tintClass="#d97706" />
              <OverviewCard title="Quá hạn" value={data?.overview?.total_overdue} tintClass="#dc2626" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Doanh thu 12 tháng</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingBlock className="h-[320px]" />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.monthly_revenue || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#93c5fd" name="Doanh thu" />
                      <Area type="monotone" dataKey="paid" stroke="#16a34a" fill="#86efac" name="Đã thu" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingBlock className="h-[320px]" />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`payment-cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top khóa học theo doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingBlock className="h-[360px]" />
            ) : (
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.top_courses || []} layout="vertical" margin={{ left: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                    <YAxis dataKey="course_name" type="category" width={180} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#0ea5e9" name="Doanh thu" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinancialDashboardPage;

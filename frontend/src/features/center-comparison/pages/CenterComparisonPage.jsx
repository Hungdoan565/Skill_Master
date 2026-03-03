import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { gooeyToast } from 'goey-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Building2, CheckCircle, AlertTriangle } from 'lucide-react';

const METRICS = [
  { key: 'revenue', label: 'Doanh thu', format: (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val), icon: DollarSign },
  { key: 'student_count', label: 'Sĩ số', format: (val) => `${val || 0} học viên`, icon: Users },
  { key: 'attendance_rate', label: 'Tỷ lệ điểm danh', format: (val) => `${val || 0}%`, icon: CheckCircle },
  { key: 'collection_rate', label: 'Tỷ lệ thu học phí', format: (val) => `${val || 0}%`, icon: TrendingUp },
  { key: 'health_score', label: 'Điểm sức khỏe', format: (val) => `${val || 0}/100`, icon: Activity },
  { key: 'staff_count', label: 'Nhân sự', format: (val) => `${val || 0} người`, icon: Building2 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function CenterComparisonPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [centersHealth, setCentersHealth] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [selectedCenterIds, setSelectedCenterIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_API_URL;

      const [healthRes, revenueRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/center-health`, { headers }),
        fetch(`${baseUrl}/api/admin/reports/revenue?months=6`, { headers })
      ]);

      const healthData = await healthRes.json();
      const revData = await revenueRes.json();

      if (healthData.success) {
        setCentersHealth(healthData.data.centers || []);
        const ids = (healthData.data.centers || []).slice(0, 3).map(c => c.id);
        setSelectedCenterIds(ids);
      } else {
        throw new Error(healthData.error || healthData.message || 'Lỗi tải sức khỏe trung tâm');
      }

      if (revData.success) {
        setRevenueData(revData.data);
      } else {
        throw new Error(revData.error || revData.message || 'Lỗi tải doanh thu');
      }
    } catch (err) {
      console.error(err);
      gooeyToast.error(err.message || 'Không thể tải dữ liệu so sánh');
    } finally {
      setLoading(false);
    }
  };

  const toggleCenter = (id) => {
    if (selectedCenterIds.includes(id)) {
      if (selectedCenterIds.length <= 2) {
        gooeyToast.error('Cần chọn ít nhất 2 trung tâm để so sánh');
        return;
      }
      setSelectedCenterIds(prev => prev.filter(cId => cId !== id));
    } else {
      if (selectedCenterIds.length >= 3) {
        gooeyToast.error('Chỉ được chọn tối đa 3 trung tâm để so sánh');
        return;
      }
      setSelectedCenterIds(prev => [...prev, id]);
    }
  };

  const selectedCenters = useMemo(() => {
    return centersHealth.filter(c => selectedCenterIds.includes(c.id));
  }, [centersHealth, selectedCenterIds]);

  const getWinnerAndLoser = (metricKey) => {
    if (selectedCenters.length === 0) return { winnerId: null, loserId: null };
    let max = -Infinity;
    let min = Infinity;
    
    selectedCenters.forEach(c => {
      const val = Number(c[metricKey]) || 0;
      if (val > max) max = val;
      if (val < min) min = val;
    });

    // If all are the same, no one is winner or loser
    if (max === min) return { winnerId: null, loserId: null };

    const winners = selectedCenters.filter(c => (Number(c[metricKey]) || 0) === max);
    const losers = selectedCenters.filter(c => (Number(c[metricKey]) || 0) === min);

    return { 
      winnerId: winners.length === 1 ? winners[0].id : null,
      loserId: losers.length === 1 ? losers[0].id : null
    };
  };

  const revenueChartData = useMemo(() => {
    if (!revenueData || !revenueData.months || selectedCenterIds.length === 0) return [];
    return revenueData.months.map(month => {
      const dataPoint = { month };
      selectedCenterIds.forEach((id, index) => {
        const center = revenueData.centers[id];
        if (center && center.monthly) {
          const monthData = center.monthly.find(m => m.month === month);
          dataPoint[`center_${index}`] = monthData ? Number(monthData.revenue) : 0;
          dataPoint[`centerName_${index}`] = center.name;
        }
      });
      return dataPoint;
    });
  }, [revenueData, selectedCenterIds]);

  const radarData = useMemo(() => {
    if (selectedCenters.length === 0) return [];
    return METRICS.map(metric => {
      const dataPoint = { subject: metric.label };
      const maxVal = Math.max(...selectedCenters.map(c => Number(c[metric.key]) || 0), 1);
      
      selectedCenters.forEach((c, index) => {
        const val = Number(c[metric.key]) || 0;
        dataPoint[`center_${index}`] = (val / maxVal) * 100;
        dataPoint[`rawValue_${index}`] = val;
        dataPoint[`centerName_${index}`] = c.name;
        dataPoint[`format_${index}`] = metric.format;
      });
      return dataPoint;
    });
  }, [selectedCenters]);

  const CustomRadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{payload[0].payload.subject}</p>
          {payload.map((entry, index) => {
            const val = entry.payload[`rawValue_${index}`];
            const format = entry.payload[`format_${index}`];
            const name = entry.payload[`centerName_${index}`];
            return (
              <div key={index} className="flex items-center gap-2 text-sm mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{name}:</span>
                <span className="font-medium">{format ? format(val) : val}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry, index) => {
            const name = entry.payload[`centerName_${index}`];
            return (
              <div key={index} className="flex items-center gap-2 text-sm mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{name}:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">So sánh Trung tâm</h1>
          <p className="text-muted-foreground mt-1">Phân tích hiệu quả hoạt động giữa các cơ sở</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Chọn trung tâm (2-3)</CardTitle>
          <CardDescription>Chọn các trung tâm bạn muốn đưa vào biểu đồ so sánh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {centersHealth.map((center) => {
              const isSelected = selectedCenterIds.includes(center.id);
              return (
                <Button
                  key={center.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => toggleCenter(center.id)}
                  className="rounded-full"
                  size="sm"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {center.name}
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 ml-2 text-primary-foreground opacity-70" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedCenters.length >= 2 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {METRICS.map(metric => {
              const { winnerId, loserId } = getWinnerAndLoser(metric.key);
              return (
                <Card key={metric.key} className="flex flex-col shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <metric.icon className="w-4 h-4" />
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 flex-1 flex flex-col gap-3 justify-end">
                    {selectedCenters.map((center) => {
                      const isWinner = center.id === winnerId;
                      const isLoser = center.id === loserId;
                      const val = Number(center[metric.key]) || 0;
                      
                      let badgeClasses = 'bg-muted';
                      if (isWinner) {
                        badgeClasses = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
                      } else if (isLoser) {
                        badgeClasses = 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
                      }

                      return (
                        <div key={center.id} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]" title={center.name}>
                            {center.name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`font-semibold ${badgeClasses}`}
                          >
                            {metric.format(val)}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tương quan Chỉ số</CardTitle>
                <CardDescription>Biểu đồ Radar so sánh tổng quan sức khỏe các trung tâm</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <RechartsTooltip content={<CustomRadarTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    {selectedCenters.map((center, idx) => (
                      <Radar
                        key={center.id}
                        name={center.name}
                        dataKey={`center_${idx}`}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.4}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Xu hướng Doanh thu (6 tháng)</CardTitle>
                <CardDescription>So sánh tăng trưởng doanh thu giữa các cơ sở</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => {
                        if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}T`;
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Tr`;
                        return val;
                      }}
                      width={60}
                    />
                    <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    {selectedCenters.map((center, idx) => (
                      <Bar
                        key={center.id}
                        name={center.name}
                        dataKey={`center_${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Chưa đủ dữ liệu so sánh</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Vui lòng chọn ít nhất 2 trung tâm ở phía trên để xem biểu đồ và các chỉ số so sánh chi tiết.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
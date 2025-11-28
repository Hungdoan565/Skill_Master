import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, BookOpen, AlertTriangle } from 'lucide-react';

const stats = [
  {
    title: 'Tổng doanh thu',
    value: '125,400,000đ',
    icon: DollarSign,
    description: 'Tháng này',
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'Học viên mới',
    value: '48',
    icon: Users,
    description: 'Tháng này',
    trend: '+8%',
    trendUp: true,
  },
  {
    title: 'Lớp đang hoạt động',
    value: '12',
    icon: BookOpen,
    description: 'Đang diễn ra',
    trend: '0%',
    trendUp: null,
  },
  {
    title: 'Công nợ',
    value: '15,200,000đ',
    icon: AlertTriangle,
    description: 'Chưa thu',
    trend: '-5%',
    trendUp: false,
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan hoạt động của trung tâm
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
                {stat.trend && (
                  <span
                    className={
                      stat.trendUp === true
                        ? ' text-emerald-600'
                        : stat.trendUp === false
                        ? ' text-rose-600'
                        : ' text-slate-500'
                    }
                  >
                    {' '}
                    {stat.trend}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
            📊 Biểu đồ doanh thu (Có thể dùng Recharts)
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Tỷ lệ học viên theo khóa</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
            🥧 Biểu đồ tròn (Có thể dùng Recharts)
          </CardContent>
        </Card>
      </div>

      {/* Recent students */}
      <Card>
        <CardHeader>
          <CardTitle>Học viên đăng ký gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium">Học viên {i}</p>
                    <p className="text-sm text-muted-foreground">
                      student{i}@email.com
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">IELTS Cơ bản</p>
                  <p className="text-xs text-muted-foreground">2 ngày trước</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

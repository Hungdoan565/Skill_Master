import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

export function CrossCenterRevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full bg-white border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Doanh thu theo tháng</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">So sánh doanh thu giữa 3 trung tâm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3 border-2 border-dashed border-border rounded-lg">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Chưa có dữ liệu doanh thu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatYAxis = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}T`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Tr`;
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatTooltip = (value) => {
    return [new Intl.NumberFormat('vi-VN').format(value) + 'đ', 'Doanh thu'];
  };

  // Using standard tailwind colors that look good in both modes
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  const dataKeys = Object.keys(data[0]).filter(key => key !== 'month' && key !== 'date' && key !== 'name');

  return (
    <Card className="h-full bg-white border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Doanh thu theo tháng</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">So sánh doanh thu giữa 3 trung tâm</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={data[0]?.month ? 'month' : data[0]?.date ? 'date' : 'name'} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                tickFormatter={formatYAxis} 
                dx={-10}
              />
              <Tooltip 
                formatter={formatTooltip} 
                contentStyle={{ 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
                }} 
                itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {dataKeys.slice(0, 3).map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  name={key}
                  stroke={colors[index % colors.length]} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

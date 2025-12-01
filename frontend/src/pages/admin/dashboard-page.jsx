import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { 
  DollarSign, Users, BookOpen, AlertTriangle, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar, Clock, 
  GraduationCap, ChevronRight, Sparkles, BarChart3, Loader2, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// DASHBOARD PAGE - Swiss Minimalism Redesign
// ============================================
// Design Principles Applied:
// - Warm stone palette matching Landing page
// - Swiss Red (#DC2626) as primary accent
// - Generous whitespace ("air")
// - Card hierarchy via shadows & borders
// - Icon containers for visual anchoring
// - Replace borders with space
// ============================================

// Stat Card Component - Primary (Large, Featured)
const PrimaryStatCard = ({ title, value, icon: Icon, trend, trendUp, description, accentColor = 'red' }) => {
  const accentClasses = {
    red: {
      iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
      iconShadow: 'shadow-red-500/25',
      trendUp: 'text-emerald-600 bg-emerald-50',
      trendDown: 'text-red-600 bg-red-50',
    },
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      iconShadow: 'shadow-emerald-500/25',
      trendUp: 'text-emerald-600 bg-emerald-50',
      trendDown: 'text-red-600 bg-red-50',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconShadow: 'shadow-amber-500/25',
      trendUp: 'text-emerald-600 bg-emerald-50',
      trendDown: 'text-amber-600 bg-amber-50',
    },
  };
  
  const accent = accentClasses[accentColor] || accentClasses.red;

  return (
    <div className="group relative bg-white rounded-2xl p-6 
                    shadow-sm shadow-stone-900/5 border border-stone-200/60
                    hover:shadow-lg hover:shadow-stone-900/10 hover:border-stone-300/60
                    transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl 
                        ${accent.iconBg} ${accent.iconShadow} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        {/* Trend Badge */}
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${trendUp ? accent.trendUp : accent.trendDown}`}>
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend}
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
        <p className="font-display text-3xl font-bold text-zinc-900 tracking-tight">
          {value}
        </p>
        <p className="text-xs text-zinc-400 mt-2">{description}</p>
      </div>

      {/* Subtle hover indicator */}
      <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-red-500/0 to-transparent
                      group-hover:via-red-500/50 transition-all duration-500" />
    </div>
  );
};

// Stat Card Component - Secondary (Compact)
const SecondaryStatCard = ({ title, value, icon: Icon, trend, trendUp, description, isDanger = false }) => (
  <div className={`rounded-2xl p-5 shadow-sm transition-all duration-300
                  ${isDanger 
                    ? 'bg-red-50 border border-red-200/60 hover:shadow-md hover:border-red-300/60' 
                    : 'bg-white shadow-stone-900/5 border border-stone-200/60 hover:shadow-md hover:border-stone-300/60'
                  }`}>
    <div className="flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl 
                      ${isDanger ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-zinc-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isDanger ? 'text-red-600' : 'text-zinc-500'}`}>{title}</p>
        <div className="flex items-baseline gap-2">
          <p className={`font-display text-xl font-bold ${isDanger ? 'text-red-700' : 'text-zinc-900'}`}>{value}</p>
          {trend && (
            <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Chart Card Component
const ChartCard = ({ title, subtitle, children, action }) => (
  <div className="bg-white rounded-2xl shadow-sm shadow-stone-900/5 border border-stone-200/60 overflow-hidden">
    {/* Card Header */}
    <div className="flex items-center justify-between p-6 pb-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action || (
        <button className="flex h-9 w-9 items-center justify-center rounded-lg 
                          text-zinc-400 hover:bg-stone-100 hover:text-zinc-600
                          transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      )}
    </div>
    {/* Card Content */}
    <div className="px-6 pb-6">
      {children}
    </div>
  </div>
);

// Student List Item Component - No borders, uses space
const StudentItem = ({ name, email, course, time, index }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl 
                   hover:bg-stone-50 transition-colors cursor-pointer group
                   ${index === 0 ? '' : ''}`}>
    <div className="flex items-center gap-4">
      {/* Avatar with gradient */}
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl 
                        bg-gradient-to-br from-red-100 to-orange-100 
                        text-red-600 font-semibold text-sm">
          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full 
                        bg-emerald-500 ring-2 ring-white" />
      </div>
      
      <div>
        <p className="font-medium text-zinc-900 group-hover:text-red-600 transition-colors">
          {name}
        </p>
        <p className="text-sm text-zinc-500">{email}</p>
      </div>
    </div>
    
    <div className="text-right">
      <p className="text-sm font-medium text-zinc-700">{course}</p>
      <p className="text-xs text-zinc-400 flex items-center justify-end gap-1 mt-0.5">
        <Clock className="h-3 w-3" />
        {time}
      </p>
    </div>
  </div>
);

// Quick Action Button
const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200/60
               hover:bg-white hover:shadow-md hover:border-stone-300/60
               transition-all duration-200 group text-left w-full"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg 
                    bg-white shadow-sm border border-stone-200/60
                    group-hover:bg-red-50 group-hover:border-red-200/60
                    transition-colors">
      <Icon className="h-5 w-5 text-zinc-600 group-hover:text-red-600 transition-colors" />
    </div>
    <span className="font-medium text-zinc-700 group-hover:text-zinc-900">{label}</span>
    <ChevronRight className="h-4 w-4 text-zinc-400 ml-auto 
                            group-hover:text-red-500 group-hover:translate-x-0.5 
                            transition-all" />
  </button>
);

// Mock chart component (placeholder with better design)
const ChartPlaceholder = ({ type = 'bar', data }) => (
  <div className="h-64 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/50 
                  border border-dashed border-stone-300 
                  flex flex-col items-center justify-center gap-3">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl 
                    bg-white shadow-sm border border-stone-200">
      <BarChart3 className="h-7 w-7 text-zinc-400" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-zinc-600">
        {type === 'bar' ? 'Biểu đồ doanh thu' : 'Biểu đồ tỷ lệ'}
      </p>
      <p className="text-xs text-zinc-400 mt-1">Tích hợp Recharts</p>
    </div>
  </div>
);

// Simple Area Chart (no external library) - Smooth curves with interactive tooltip
const SimpleAreaChart = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!data || data.length === 0) return <ChartPlaceholder type="bar" />;
  
  const maxValue = Math.max(...data.map(d => d.revenue), 1);
  const width = 100;
  const height = 60;
  const paddingLeft = 12;
  const paddingRight = 5;
  const paddingTop = 5;
  const paddingBottom = 5;
  
  // Format Y-axis values
  const formatYAxis = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(0)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };
  
  // Calculate points for the path
  const points = data.map((item, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * (width - paddingLeft - paddingRight);
    const y = height - paddingBottom - ((item.revenue / maxValue) * (height - paddingTop - paddingBottom));
    return { x, y, ...item };
  });
  
  // Create smooth curve path (using catmull-rom to bezier)
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = prev.x + (curr.x - prev.x) * 0.5;
    pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  
  // Area path (close at bottom)
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  
  // Y-axis tick values
  const yTicks = [0, 0.5, 1].map(ratio => ({
    value: Math.round(maxValue * ratio),
    y: height - paddingBottom - ratio * (height - paddingTop - paddingBottom)
  }));
  
  return (
    <div className="h-64 flex flex-col">
      {/* Chart container with Y-axis */}
      <div className="flex-1 flex">
        {/* Y-axis labels */}
        <div className="w-12 flex flex-col justify-between py-1 pr-2 text-right">
          {yTicks.reverse().map((tick, i) => (
            <span key={i} className="text-[10px] text-zinc-400 leading-none">
              {formatYAxis(tick.value)}
            </span>
          ))}
        </div>
        
        {/* SVG Chart */}
        <div className="flex-1 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Grid lines */}
            {[0, 0.5, 1].map((ratio, i) => (
              <line
                key={i}
                x1={paddingLeft}
                y1={height - paddingBottom - ratio * (height - paddingTop - paddingBottom)}
                x2={width - paddingRight}
                y2={height - paddingBottom - ratio * (height - paddingTop - paddingBottom)}
                stroke="#e5e7eb"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
            ))}
            
            {/* Area fill */}
            <path d={areaD} fill="url(#areaGradient)" />
            
            {/* Main line */}
            <path
              d={pathD}
              fill="none"
              stroke="#ef4444"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                {/* Outer glow on hover */}
                {hoveredPoint === index && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="2"
                    fill="#ef4444"
                    opacity="0.3"
                  />
                )}
                {/* Main dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredPoint === index ? "1.5" : "1"}
                  fill={hoveredPoint === index ? "#ef4444" : "#fff"}
                  stroke="#ef4444"
                  strokeWidth="0.5"
                  className="transition-all duration-150"
                />
                {/* Invisible hover target */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                
                {/* Vertical line on hover */}
                {hoveredPoint === index && (
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={point.x}
                    y2={height - paddingBottom}
                    stroke="#ef4444"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                    opacity="0.5"
                  />
                )}
              </g>
            ))}
          </svg>
          
          {/* Tooltip */}
          {hoveredPoint !== null && (
            <div 
              className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${((points[hoveredPoint].x - paddingLeft) / (width - paddingLeft - paddingRight)) * 100}%`,
                top: `${(points[hoveredPoint].y / height) * 100 - 5}%`
              }}
            >
              <div className="bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-zinc-700">
                <div className="font-semibold text-red-400">{points[hoveredPoint].formatted}</div>
                <div className="text-zinc-400 text-[10px]">{points[hoveredPoint].month}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between pl-12 pr-1 mt-2">
        {data.map((item, index) => (
          <span 
            key={index} 
            className={`text-xs font-medium transition-colors ${
              hoveredPoint === index ? 'text-red-500' : 'text-zinc-400'
            }`}
          >
            {item.month}
          </span>
        ))}
      </div>
    </div>
  );
};

// Simple Pie/Donut representation
const SimplePieChart = ({ data }) => {
  if (!data || data.length === 0) return <ChartPlaceholder type="pie" />;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-indigo-500'];
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-700 truncate">{item.name}</span>
                <span className="text-sm font-medium text-zinc-900">{item.value}</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-zinc-400 w-10 text-right">{percent}%</span>
          </div>
        );
      })}
    </div>
  );
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [courseDistribution, setCourseDistribution] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // API headers
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  }), [session?.access_token]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
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
  }, [getHeaders]);

  // Initial load
  useEffect(() => {
    if (session?.access_token) {
      fetchDashboardData();
    }
  }, [session?.access_token, fetchDashboardData]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng!';
    if (hour < 18) return 'Chào buổi chiều!';
    return 'Chào buổi tối!';
  };

  // Format current date
  const getCurrentDate = () => {
    const now = new Date();
    return `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">{getGreeting()}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">
            Tổng quan hoạt động của trung tâm
          </p>
        </div>
        
        {/* Date indicator + Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl 
                          border border-stone-200/60 shadow-sm">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-600">
              {getCurrentDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Stats Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <PrimaryStatCard 
          title="Tổng doanh thu"
          value={stats?.revenue?.formatted || '0 đ'}
          icon={DollarSign}
          trend={stats?.revenue?.trend ? `${stats.revenue.trend > 0 ? '+' : ''}${stats.revenue.trend}%` : null}
          trendUp={stats?.revenue?.trendUp}
          description={stats?.revenue?.description || 'Doanh thu tháng này'}
          accentColor="red"
        />
        <PrimaryStatCard 
          title="Học viên ghi danh"
          value={stats?.newStudents?.value || 0}
          icon={Users}
          trend={stats?.newStudents?.trend ? `${stats.newStudents.trend > 0 ? '+' : ''}${stats.newStudents.trend}%` : null}
          trendUp={stats?.newStudents?.trendUp}
          description={stats?.newStudents?.description || 'Trong tháng này'}
          accentColor="emerald"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <SecondaryStatCard 
          title="Lớp hoạt động"
          value={stats?.activeClasses?.value || 0}
          icon={BookOpen}
          description="Đang diễn ra + Sắp mở"
        />
        <SecondaryStatCard 
          title="Công nợ cần thu"
          value={stats?.debt?.formatted || '0 đ'}
          icon={AlertTriangle}
          description="Học phí chưa thu đủ"
          isDanger={stats?.debt?.value > 0}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart - Takes more space */}
        <div className="lg:col-span-3">
          <ChartCard 
            title="Doanh thu theo tháng" 
            subtitle="12 tháng gần nhất"
          >
            <SimpleAreaChart data={revenueChart} />
          </ChartCard>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2">
          <ChartCard 
            title="Phân bố học viên" 
            subtitle="Theo khóa học"
          >
            <SimplePieChart data={courseDistribution} />
          </ChartCard>
        </div>
      </div>

      {/* Bottom Section: Recent Students + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Students - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm shadow-stone-900/5 border border-stone-200/60">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-zinc-900">
                  Học viên ghi danh gần đây
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {recentStudents.length} học viên mới nhất
                </p>
              </div>
              <button 
                onClick={() => navigate('/admin/students')}
                className="text-sm font-medium text-red-600 hover:text-red-700 
                          flex items-center gap-1 transition-colors"
              >
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {/* Student List */}
            <div className="p-4 pt-2 space-y-1">
              {recentStudents.length > 0 ? (
                recentStudents.map((student, index) => (
                  <StudentItem key={student.id || index} {...student} index={index} />
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  Chưa có học viên ghi danh
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-zinc-900 px-1">
            Thao tác nhanh
          </h3>
          <div className="space-y-3">
            <QuickAction icon={Users} label="Thêm học viên mới" onClick={() => navigate('/admin/students')} />
            <QuickAction icon={GraduationCap} label="Mở lớp học mới" onClick={() => navigate('/admin/classes')} />
            <QuickAction icon={Calendar} label="Quản lý khóa học" onClick={() => navigate('/admin/courses')} />
            <QuickAction icon={DollarSign} label="Xem báo cáo tài chính" onClick={() => navigate('/admin/finance')} />
          </div>
        </div>
      </div>
    </div>
  );
}

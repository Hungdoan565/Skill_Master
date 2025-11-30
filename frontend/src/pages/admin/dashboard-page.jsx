import { 
  DollarSign, Users, BookOpen, AlertTriangle, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar, Clock, 
  GraduationCap, ChevronRight, Sparkles, BarChart3
} from 'lucide-react';

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
const SecondaryStatCard = ({ title, value, icon: Icon, trend, trendUp, description }) => (
  <div className="bg-white rounded-2xl p-5 
                  shadow-sm shadow-stone-900/5 border border-stone-200/60
                  hover:shadow-md hover:border-stone-300/60
                  transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl 
                      bg-stone-100 text-zinc-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-500 truncate">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-xl font-bold text-zinc-900">{value}</p>
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
const ChartPlaceholder = ({ type = 'bar' }) => (
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

// Stats data
const stats = [
  {
    title: 'Tổng doanh thu',
    value: '125.4M đ',
    icon: DollarSign,
    description: 'Doanh thu tháng 11/2025',
    trend: '+12%',
    trendUp: true,
    accentColor: 'red',
    primary: true,
  },
  {
    title: 'Học viên mới',
    value: '48',
    icon: Users,
    description: 'Đăng ký trong tháng',
    trend: '+8%',
    trendUp: true,
    accentColor: 'emerald',
    primary: true,
  },
  {
    title: 'Lớp đang hoạt động',
    value: '12',
    icon: BookOpen,
    description: 'Đang diễn ra',
    trend: null,
    trendUp: null,
    primary: false,
  },
  {
    title: 'Công nợ',
    value: '15.2M đ',
    icon: AlertTriangle,
    description: 'Cần thu hồi',
    trend: '-5%',
    trendUp: false,
    accentColor: 'amber',
    primary: false,
  },
];

// Recent students data
const recentStudents = [
  { name: 'Nguyễn Minh Anh', email: 'minhanh@gmail.com', course: 'IELTS Intensive', time: '2 giờ trước' },
  { name: 'Trần Văn Hùng', email: 'vanhung@gmail.com', course: 'TOEIC 700+', time: '5 giờ trước' },
  { name: 'Lê Thị Hương', email: 'huong.le@gmail.com', course: 'Excel Pro', time: '1 ngày trước' },
  { name: 'Phạm Đức Long', email: 'longpd@gmail.com', course: 'IELTS Cơ bản', time: '2 ngày trước' },
];

export function DashboardPage() {
  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">Chào buổi sáng!</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">
            Tổng quan hoạt động của trung tâm
          </p>
        </div>
        
        {/* Date indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl 
                        border border-stone-200/60 shadow-sm">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600">
            Tháng 11, 2025
          </span>
        </div>
      </div>

      {/* Primary Stats Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {stats.filter(s => s.primary).map((stat) => (
          <PrimaryStatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.filter(s => !s.primary).map((stat) => (
          <SecondaryStatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart - Takes more space */}
        <div className="lg:col-span-3">
          <ChartCard 
            title="Doanh thu theo tháng" 
            subtitle="So sánh với cùng kỳ năm trước"
          >
            <ChartPlaceholder type="bar" />
          </ChartCard>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2">
          <ChartCard 
            title="Tỷ lệ học viên" 
            subtitle="Phân bố theo khóa học"
          >
            <ChartPlaceholder type="pie" />
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
                  Học viên đăng ký gần đây
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {recentStudents.length} học viên mới trong tuần này
                </p>
              </div>
              <button className="text-sm font-medium text-red-600 hover:text-red-700 
                                flex items-center gap-1 transition-colors">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {/* Student List - Using space instead of borders */}
            <div className="p-4 pt-2 space-y-1">
              {recentStudents.map((student, index) => (
                <StudentItem key={student.email} {...student} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-zinc-900 px-1">
            Thao tác nhanh
          </h3>
          <div className="space-y-3">
            <QuickAction icon={Users} label="Thêm học viên mới" />
            <QuickAction icon={GraduationCap} label="Mở lớp học mới" />
            <QuickAction icon={Calendar} label="Xếp lịch học" />
            <QuickAction icon={DollarSign} label="Tạo hóa đơn" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatsSection Component
 * Section hiển thị các stats cards - matching original dashboard UI
 */

import { Users, BookOpen, DollarSign, AlertTriangle } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Helper: Extract value from object or return as-is
const getValue = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object' && val.value !== undefined) return val.value;
  return val;
};

// Helper: Get formatted value
const getFormatted = (val) => {
  if (val === null || val === undefined) return '0đ';
  if (typeof val === 'object' && val.formatted !== undefined) return val.formatted;
  return val;
};

// Helper: Get trend
const getTrend = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.trend !== undefined) return val.trend;
  return null;
};

// Helper: Check if trend is up
const isTrendUp = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'object' && val.trendUp !== undefined) return val.trendUp;
  return getTrend(val) >= 0;
};

// Helper: Get description
const getDescription = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && val.description !== undefined) return val.description;
  return '';
};

// Large stat card component (for Revenue and New Students)
function LargeStatCard({ title, value, description, trend, trendUp, icon: Icon, color = 'orange' }) {
  const colorClasses = {
    orange: 'bg-orange-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };

  const iconBg = colorClasses[color] || colorClasses.orange;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
          <Icon size={24} className="text-white" />
        </div>
        
        {trend !== null && trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            trendUp 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-red-50 text-red-600'
          }`}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

// Small stat card component (for Active Classes and Debt)
function SmallStatCard({ title, value, icon: Icon, alert = false }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${alert ? 'border-red-100' : 'border-gray-100'} p-5 hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center gap-4">
        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${
          alert 
            ? 'bg-red-50' 
            : 'bg-gray-50'
        }`}>
          <Icon size={22} className={alert ? 'text-red-500' : 'text-gray-600'} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{title}</p>
          <h4 className={`text-xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </h4>
        </div>
      </div>
    </div>
  );
}

export function StatsSection({ stats, loading = false }) {
  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-14 w-14 bg-gray-200 rounded-2xl mb-4" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-gray-200 rounded-xl" />
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Extract values from API response
  const revenue = stats.revenue || {};
  const newStudents = stats.newStudents || {};
  const activeClasses = stats.activeClasses || {};
  const debt = stats.debt || {};

  return (
    <div className="space-y-4">
      {/* Top row: Large cards - Revenue and New Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LargeStatCard
          title="Tổng doanh thu"
          value={getFormatted(revenue) || getValue(revenue) || '0đ'}
          description={getDescription(revenue)}
          trend={getTrend(revenue)}
          trendUp={isTrendUp(revenue)}
          icon={DollarSign}
          color="orange"
        />
        <LargeStatCard
          title="Học viên ghi danh"
          value={getValue(newStudents)}
          description={getDescription(newStudents)}
          trend={getTrend(newStudents)}
          trendUp={isTrendUp(newStudents)}
          icon={Users}
          color="green"
        />
      </div>

      {/* Bottom row: Small cards - Active Classes and Debt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmallStatCard
          title="Lớp hoạt động"
          value={getValue(activeClasses)}
          icon={BookOpen}
        />
        <SmallStatCard
          title="Công nợ cần thu"
          value={getFormatted(debt) || getValue(debt) || '0đ'}
          icon={AlertTriangle}
          alert={getValue(debt) > 0}
        />
      </div>
    </div>
  );
}

export default StatsSection;

/**
 * SessionStats Component - Thống kê nhanh các buổi học
 */

import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

export function SessionStats({ stats, loading }) {
  const statCards = [
    {
      label: 'Tổng buổi học',
      value: stats.total || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50'
    },
    {
      label: 'Đã hoàn thành',
      value: stats.completed || 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      bgLight: 'bg-green-50'
    },
    {
      label: 'Chưa dạy',
      value: stats.scheduled || 0,
      icon: Clock,
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50'
    },
    {
      label: 'Quá hạn chưa điểm danh',
      value: stats.overdue || 0,
      icon: AlertTriangle,
      color: 'bg-red-600',
      bgLight: 'bg-red-100',
      highlight: stats.overdue > 0,
      urgent: true // Flag để style đặc biệt
    },
    {
      label: 'Đã hủy',
      value: stats.cancelled || 0,
      icon: XCircle,
      color: 'bg-slate-500',
      bgLight: 'bg-slate-50'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-8 w-8 bg-slate-200 rounded-lg mb-2" />
            <div className="h-6 w-16 bg-slate-200 rounded mb-1" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index}
            className={`
              rounded-xl p-4 border transition-all
              ${stat.urgent && stat.highlight 
                ? 'bg-red-600 border-red-600 ring-2 ring-red-300 shadow-lg shadow-red-200' 
                : stat.highlight 
                  ? 'bg-red-50 border-red-200 ring-2 ring-red-100' 
                  : 'bg-white border-slate-200 hover:shadow-md'
              }
            `}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center mb-3
              ${stat.urgent && stat.highlight ? 'bg-white/20' : stat.highlight ? 'bg-red-100' : stat.bgLight}
            `}>
              <Icon className={`w-5 h-5 ${stat.urgent && stat.highlight ? 'text-white' : stat.highlight ? 'text-red-600' : 'text-slate-600'}`} />
            </div>
            <div className={`text-2xl font-bold ${stat.urgent && stat.highlight ? 'text-white' : stat.highlight ? 'text-red-600' : 'text-slate-900'}`}>
              {stat.value}
            </div>
            <div className={`text-sm ${stat.urgent && stat.highlight ? 'text-red-100' : stat.highlight ? 'text-red-600' : 'text-slate-500'}`}>
              {stat.label}
            </div>
            {stat.urgent && stat.highlight && (
              <div className="mt-2 text-xs text-white/80 font-medium animate-pulse">
                ⚠️ Cần xử lý ngay!
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SessionStats;

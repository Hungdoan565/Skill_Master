/**
 * RoomStatsCards Component
 * Thẻ thống kê phòng học - Style đồng bộ
 */

import { DoorOpen, Users, Monitor, Wrench } from 'lucide-react';

export function RoomStatsCards({ stats }) {
  const items = [
    {
      icon: DoorOpen,
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/20',
      value: stats.totalRooms,
      label: 'Tổng phòng'
    },
    {
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/20',
      value: stats.totalCapacity,
      label: 'Tổng sức chứa'
    },
    {
      icon: Monitor,
      gradient: 'from-purple-500 to-violet-600',
      shadowColor: 'shadow-purple-500/20',
      value: stats.labCount,
      label: 'Phòng Lab'
    },
    {
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/20',
      value: stats.maintenanceCount,
      label: 'Đang bảo trì'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div 
          key={index}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 bg-linear-to-br ${item.gradient} rounded-xl shadow-lg ${item.shadowColor}`}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RoomStatsCards;

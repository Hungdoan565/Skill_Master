/**
 * RoomStatsCards Component
 * Thẻ thống kê phòng học
 */

import { Building2, Users, Monitor, Wind } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function RoomStatsCards({ stats }) {
  const items = [
    {
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      value: stats.totalRooms,
      label: 'Tổng phòng'
    },
    {
      icon: Users,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      value: stats.totalCapacity,
      label: 'Tổng sức chứa'
    },
    {
      icon: Monitor,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      value: stats.labCount,
      label: 'Phòng Lab'
    },
    {
      icon: Wind,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      value: stats.maintenanceCount,
      label: 'Đang bảo trì'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${item.iconBg} rounded-lg`}>
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default RoomStatsCards;

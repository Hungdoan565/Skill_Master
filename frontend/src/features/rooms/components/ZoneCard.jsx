/**
 * ZoneCard Component
 * Card hiển thị khu với thông tin số phòng, sức chứa, trạng thái
 */

import { Package, DoorOpen, Users, Activity, ChevronRight } from 'lucide-react';

export function ZoneCard({ zone, rooms, onClick }) {
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
  const activeRooms = rooms.filter(r => r.status === 'active').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-orange-600 transition-colors">
              Khu {zone}
            </h3>
            <p className="text-sm text-slate-500">{rooms.length} phòng</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Sức chứa */}
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{totalCapacity}</span>
          </div>
          <p className="text-xs text-blue-700">Chỗ</p>
        </div>

        {/* Hoạt động */}
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Activity className="h-3.5 w-3.5 text-green-600" />
            <span className="text-lg font-bold text-green-600">{activeRooms}</span>
          </div>
          <p className="text-xs text-green-700">Hoạt động</p>
        </div>

        {/* Bảo trì */}
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Activity className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-lg font-bold text-amber-600">{maintenanceRooms}</span>
          </div>
          <p className="text-xs text-amber-700">Bảo trì</p>
        </div>
      </div>

      {/* Room codes preview */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-1.5">
          {rooms.slice(0, 6).map((room, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded"
            >
              {room.code}
            </span>
          ))}
          {rooms.length > 6 && (
            <span className="px-2 py-0.5 text-xs font-medium text-slate-400">
              +{rooms.length - 6} khác
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ZoneCard;

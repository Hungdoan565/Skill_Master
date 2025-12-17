/**
 * CenterCard Component
 * Card hiển thị trung tâm với stats (số khu, số phòng, sức chứa)
 */

import { Building2, Package, DoorOpen, Users, ChevronRight } from 'lucide-react';

export function CenterCard({ center, stats, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-orange-600 transition-colors">
              {center.name}
            </h3>
            <p className="text-sm text-slate-500">{center.code}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Số khu */}
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Package className="h-4 w-4 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">{stats.zones}</span>
          </div>
          <p className="text-xs text-purple-700">Khu</p>
        </div>

        {/* Số phòng */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DoorOpen className="h-4 w-4 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{stats.rooms}</span>
          </div>
          <p className="text-xs text-blue-700">Phòng</p>
        </div>

        {/* Tổng sức chứa */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats.capacity}</span>
          </div>
          <p className="text-xs text-green-700">Chỗ</p>
        </div>
      </div>

      {/* Footer */}
      {center.address && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 truncate">{center.address}</p>
        </div>
      )}
    </div>
  );
}

export default CenterCard;

/**
 * RoomCard Component
 * Card hiển thị thông tin phòng - Style đẹp với gradient border
 */

import { Edit2, Trash2, Users, DoorOpen, Building2 } from 'lucide-react';
import { RoomTypeBadge } from './RoomTypeBadge';
import { StatusBadge } from './StatusBadge';
import { EquipmentTags } from './EquipmentTags';

export function RoomCard({ room, onEdit, onDelete }) {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:border-orange-200 dark:hover:border-orange-500/50 transition-all duration-300 overflow-hidden">
      {/* Header with gradient accent */}
      <div className="relative p-4 pb-3">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="p-2.5 bg-linear-to-br from-slate-100 to-slate-50 dark:from-gray-700 dark:to-gray-700 rounded-xl border border-slate-200 dark:border-gray-600 group-hover:from-orange-100 group-hover:to-red-50 dark:group-hover:from-orange-900/30 dark:group-hover:to-red-900/20 group-hover:border-orange-200 dark:group-hover:border-orange-700 transition-colors">
              <DoorOpen className="h-5 w-5 text-slate-600 dark:text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
                {room.name}
              </h3>
              {room.code && (
                <span className="text-xs font-mono text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  {room.code}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 mt-1">
                <Building2 className="h-3 w-3" />
                {room.centers?.name || 'Chưa gán trung tâm'}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(room)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 hover:text-orange-600 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onDelete(room)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-gray-400 hover:text-red-600 transition-colors"
              title="Xóa phòng"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <RoomTypeBadge type={room.room_type} />
          <StatusBadge status={room.status} />
        </div>
        
        {/* Capacity */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-400">
          <Users className="h-4 w-4 text-slate-400 dark:text-gray-500" />
          <span className="font-medium">{room.capacity}</span>
          <span className="text-slate-400 dark:text-gray-500">chỗ</span>
        </div>
        
        {/* Equipment */}
        <EquipmentTags equipment={room.equipment} />
      </div>
    </div>
  );
}

export default RoomCard;

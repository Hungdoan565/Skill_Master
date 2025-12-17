/**
 * RoomsGrid Component
 * Grid hiển thị danh sách phòng theo khu
 */

import { Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomCard } from './RoomCard';
import { groupAndSortRoomsByZone } from '../utils';

export function RoomsGrid({ rooms, loading, onEdit, onDelete, onAddClick }) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Đang tải...</div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Chưa có phòng học nào</p>
        <Button onClick={onAddClick} variant="outline" className="mt-4">
          Thêm phòng đầu tiên
        </Button>
      </div>
    );
  }

  // Group rooms by zone
  const groupedRooms = groupAndSortRoomsByZone(rooms);
  const zones = Object.keys(groupedRooms).sort();

  return (
    <div className="space-y-8">
      {zones.map(zone => (
        <div key={zone} className="space-y-4">
          {/* Zone Header */}
          <div className="flex items-center gap-3 pb-2 border-b-2 border-orange-200">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-sm">
              <Package className="h-4 w-4" />
              <span className="font-semibold">Khu {zone}</span>
            </div>
            <span className="text-sm text-gray-500">
              {groupedRooms[zone].length} phòng
            </span>
          </div>

          {/* Rooms Grid for this zone */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedRooms[zone].map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RoomsGrid;

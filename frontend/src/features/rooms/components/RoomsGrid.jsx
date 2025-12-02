/**
 * RoomsGrid Component
 * Grid hiển thị danh sách phòng
 */

import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomCard } from './RoomCard';

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map(room => (
        <RoomCard
          key={room.id}
          room={room}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default RoomsGrid;

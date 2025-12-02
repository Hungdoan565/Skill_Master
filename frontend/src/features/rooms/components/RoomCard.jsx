/**
 * RoomCard Component
 * Card hiển thị thông tin phòng
 */

import { Edit2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomTypeBadge } from './RoomTypeBadge';
import { StatusBadge } from './StatusBadge';
import { EquipmentTags } from './EquipmentTags';

export function RoomCard({ room, onEdit, onDelete }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {room.name}
              {room.code && (
                <span className="text-sm font-normal text-gray-400">({room.code})</span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">{room.centers?.name}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(room)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(room)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <RoomTypeBadge type={room.room_type} />
          <StatusBadge status={room.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {room.capacity} chỗ
          </span>
        </div>
        <EquipmentTags equipment={room.equipment} />
      </CardContent>
    </Card>
  );
}

export default RoomCard;

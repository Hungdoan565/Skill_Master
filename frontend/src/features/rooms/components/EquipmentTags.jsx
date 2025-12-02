/**
 * EquipmentTags Component
 * Hiển thị danh sách thiết bị phòng
 */

import { Monitor, Projector, Wind, Video, MoreHorizontal } from 'lucide-react';
import { EQUIPMENT_LABELS } from '../utils';

// Icon mapping cho thiết bị
const equipmentIcons = {
  projector: Projector,
  computers: Monitor,
  air_conditioner: Wind,
  video_conference: Video,
  whiteboard: MoreHorizontal
};

export function EquipmentTags({ equipment = [] }) {
  if (!equipment || equipment.length === 0) {
    return <span className="text-gray-400 text-sm">Chưa có thiết bị</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {equipment.map((item, idx) => {
        const Icon = equipmentIcons[item] || MoreHorizontal;
        return (
          <span 
            key={idx} 
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
          >
            <Icon className="h-3 w-3" />
            {EQUIPMENT_LABELS[item] || item}
          </span>
        );
      })}
    </div>
  );
}

export default EquipmentTags;

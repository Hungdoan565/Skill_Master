/**
 * RoomTypeBadge Component
 * Badge hiển thị loại phòng
 */

import { Badge } from '@/components/ui/badge';
import { ROOM_TYPE_CONFIG } from '../utils';

export function RoomTypeBadge({ type }) {
  const config = ROOM_TYPE_CONFIG[type] || ROOM_TYPE_CONFIG.standard;
  return <Badge className={config.className}>{config.label}</Badge>;
}

export default RoomTypeBadge;

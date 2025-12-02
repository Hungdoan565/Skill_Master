/**
 * StatusBadge Component
 * Badge hiển thị trạng thái phòng
 */

import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from '../utils';

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return <Badge className={config.className}>{config.label}</Badge>;
}

export default StatusBadge;

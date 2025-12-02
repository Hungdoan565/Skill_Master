/**
 * RoleBadge Component
 * Badge hiển thị vai trò nhân viên
 */

import { ROLE_CONFIG } from '../utils';

export function RoleBadge({ roleCode }) {
  const config = ROLE_CONFIG[roleCode] || ROLE_CONFIG.TEACHER;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

export default RoleBadge;

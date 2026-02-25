/**
 * Determine effective center scope for a user.
 * - SUPER_ADMIN: can access all centers, optionally scoped by requested center id
 * - CENTER_MANAGER (and others): must have a center and can only access their own center
 *
 * @returns {{ effectiveCenterId: string|null, error: string|null }}
 */
export function getEffectiveCenterId(user, requestedCenterId = null) {
  const userRole = user.roleCode;
  const userCenterId = user.centerId;

  // SUPER_ADMIN: no filter or use centerId from request
  if (userRole === 'SUPER_ADMIN') {
    return {
      effectiveCenterId: requestedCenterId || null,
      error: null,
    };
  }

  // CENTER_MANAGER (or other): must have center and only access own center
  if (!userCenterId) {
    return {
      effectiveCenterId: null,
      error: 'Bạn chưa được gán vào trung tâm nào. Vui lòng liên hệ admin.',
    };
  }

  if (requestedCenterId && requestedCenterId !== userCenterId) {
    return {
      effectiveCenterId: null,
      error: 'Bạn không có quyền xem dữ liệu của trung tâm khác.',
    };
  }

  return {
    effectiveCenterId: userCenterId,
    error: null,
  };
}

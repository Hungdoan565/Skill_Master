import { useAuth } from '@/contexts/auth-context';
import { useCenterContext } from '@/contexts/center-context';

/**
 * Returns query params object with centerId if a center is selected.
 * Use with URLSearchParams to append to API calls.
 * Only applies for SUPER_ADMIN role.
 */
export function useCenterQuery() {
  const { isSuperAdmin } = useAuth();

  try {
    const { selectedCenterId } = useCenterContext();

    if (!isSuperAdmin?.() || !selectedCenterId) {
      return {};
    }

    return { centerId: selectedCenterId };
  } catch {
    return {};
  }
}

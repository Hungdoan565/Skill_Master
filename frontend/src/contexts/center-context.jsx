import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

const CenterContext = createContext(undefined);

export function CenterProvider({ children }) {
  const { session, isSuperAdmin } = useAuth();
  const [selectedCenterId, setSelectedCenterId] = useState(() => {
    return localStorage.getItem('admin_selected_center') || null;
  });
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token || !isSuperAdmin?.()) {
      setLoading(false);
      return;
    }

    const fetchCenters = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/admin/centers`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setCenters(data.data);

          if (selectedCenterId && !data.data.find((center) => center.id === selectedCenterId)) {
            setSelectedCenterId(null);
            localStorage.removeItem('admin_selected_center');
          }
        }
      } catch (err) {
        console.error('[CenterContext] Failed to fetch centers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCenters();
  }, [session?.access_token, isSuperAdmin]);

  const selectCenter = useCallback((centerId) => {
    setSelectedCenterId(centerId);

    if (centerId) {
      localStorage.setItem('admin_selected_center', centerId);
    } else {
      localStorage.removeItem('admin_selected_center');
    }
  }, []);

  const value = { selectedCenterId, selectCenter, centers, loading };

  return <CenterContext.Provider value={value}>{children}</CenterContext.Provider>;
}

export function useCenterContext() {
  const context = useContext(CenterContext);

  if (context === undefined) {
    throw new Error('useCenterContext must be used within a CenterProvider');
  }

  return context;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { gooeyToast } from 'goey-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useNotifications() {
  const { session, user } = useAuth();
  const userId = session?.user?.id || user?.id;
  const accessToken = session?.access_token;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => {
    if (!accessToken) return null;
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }, [accessToken]);

  const fetchNotifications = useCallback(async () => {
    if (!authHeaders) return;

    setLoading(true);
    try {
      const [unreadResponse, recentResponse] = await Promise.all([
        fetch(`${API_URL}/api/notifications?unread=true&limit=20&page=1`, {
          headers: authHeaders
        }),
        fetch(`${API_URL}/api/notifications?limit=20&page=1`, {
          headers: authHeaders
        })
      ]);

      let unreadJson = { success: false };
      let recentJson = { success: false };

      if (unreadResponse.ok) {
        try { unreadJson = await unreadResponse.json(); } catch { /* non-JSON response */ }
      }
      if (recentResponse.ok) {
        try { recentJson = await recentResponse.json(); } catch { /* non-JSON response */ }
      }

      if (recentResponse.ok && recentJson?.success) {
        setNotifications(recentJson.data?.notifications || []);
      } else {
        setNotifications([]);
      }

      if (unreadResponse.ok && unreadJson?.success) {
        setUnreadCount(unreadJson.data?.unreadCount || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const markAsRead = useCallback(async (id) => {
    if (!authHeaders || !id) return false;

    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders
      });

      const json = await response.json();
      if (!response.ok || !json?.success) {
        return false;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, read_at: json?.data?.read_at || new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [authHeaders]);

  const markAllAsRead = useCallback(async () => {
    if (!authHeaders) return false;

    try {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: authHeaders
      });

      const json = await response.json();
      if (!response.ok || !json?.success) {
        return false;
      }

      const nowIso = new Date().toISOString();
      setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || nowIso })));
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return undefined;

    if (accessToken) {
      supabase.realtime.setAuth(accessToken);
    }

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const next = payload.new;
          if (!next) return;

          setNotifications((prev) => {
            const exists = prev.some((item) => item.id === next.id);
            if (exists) return prev;
            return [next, ...prev].slice(0, 20);
          });

          if (!next.read_at) {
            setUnreadCount((prev) => prev + 1);

            gooeyToast.info(next.title || 'Bạn có thông báo mới', {
              description: next.message || 'Nhấn vào chuông thông báo để xem chi tiết.'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, accessToken]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}

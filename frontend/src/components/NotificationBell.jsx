import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';

function formatRelativeTime(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

  if (absMinutes < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

function truncateMessage(message, maxLength = 90) {
  if (!message) return '';
  if (message.length <= maxLength) return message;
  return `${message.slice(0, maxLength)}...`;
}

export function NotificationBell({
  notifications = [],
  unreadCount = 0,
  markAsRead,
  markAllAsRead,
  loading = false
}) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roleCode = profile?.roles?.code;
  const recentNotifications = useMemo(() => (notifications || []).slice(0, 20), [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resolveReferencePath = (item) => {
    const refType = item?.reference_type;

    if (refType === 'payment') {
      if (roleCode === 'STUDENT') return '/student/payment';
      return '/invoices';
    }

    if (refType === 'leave_request') {
      return '/teacher/leave-requests';
    }

    if (refType === 'enrollment') {
      if (roleCode === 'STUDENT') return '/student/schedule';
      return '/classes';
    }

    if (item?.type === 'grade_published') {
      if (roleCode === 'STUDENT') return '/student/grades';
      return '/reports/grades';
    }

    return null;
  };

  const handleNotificationClick = async (item) => {
    if (!item) return;

    if (!item.read_at && typeof markAsRead === 'function') {
      await markAsRead(item.id);
    }

    const path = resolveReferencePath(item);
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
        aria-label={t('common:notifications')}
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-card">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-[22rem] rounded-xl border border-border bg-popover shadow-lg z-[120] transition-all duration-150 ${
          isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold text-foreground">{t('common:notifications')}</p>
          <button
            onClick={() => markAllAsRead && markAllAsRead()}
            disabled={unreadCount === 0}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            {t('common:markAllRead')}
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t('common:loadingNotifications')}</div>
          ) : recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t('common:noNotifications')}</div>
          ) : (
            recentNotifications.map((item) => {
              const isUnread = !item.read_at;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`w-full border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-accent/50 ${
                    isUnread ? 'bg-blue-50/60 border-l-2 border-l-blue-500' : 'bg-background'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.message && (
                    <p className="mt-1 text-xs text-muted-foreground">{truncateMessage(item.message)}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationBell;

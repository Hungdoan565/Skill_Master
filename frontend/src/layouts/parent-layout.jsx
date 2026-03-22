import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ParentSidebar } from '@/components/layout/parent-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { NotificationBell } from '@/components/NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/contexts/theme-context';

export function ParentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notificationState = useNotifications();
  const { isDark } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/50 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[200] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onClick={(e) => {
          if (e.target.closest('a') || e.target.closest('button')) {
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }
        }}
      >
        <ParentSidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full relative">
        {/* Header */}
        <div className="relative z-[100] flex items-center bg-card border-b border-border shadow-sm dark:shadow-none h-16 md:h-auto md:block md:border-0 md:bg-transparent">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 overflow-visible">
            <AdminHeader notificationBell={<NotificationBell {...notificationState} />} showCenterSwitcher={false} />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto relative z-0">
          <div className={`min-h-full relative ${isDark ? 'bg-background' : 'bg-[#fff8f0]'}`}>
            {!isDark && (
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 80%, rgba(255, 182, 153, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255, 244, 214, 0.5) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(255, 182, 153, 0.1) 0%, transparent 50%)`,
                }}
              />
            )}
            {isDark && (
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)`,
                }}
              />
            )}
            <div className="min-h-full p-6 lg:p-8 relative">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

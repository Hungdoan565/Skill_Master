import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - z-index cao để dropdown không bị đè */}
        <div className="relative z-50">
          <AdminHeader />
        </div>

        {/* Page content - Warm stone background with subtle pattern */}
        <main className="flex-1 overflow-auto relative z-0">
          {/* Background layer with subtle gradient */}
          <div className="min-h-full bg-gradient-to-br from-stone-50 via-stone-100/80 to-orange-50/30">
            {/* Subtle grid pattern overlay */}
            <div
              className="min-h-full p-8 lg:p-10"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

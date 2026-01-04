import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - z-index cao để dropdown không bị đè */}
        <div className="relative z-[100]">
          <AdminHeader />
        </div>

        {/* Page content - Swiss minimal background with subtle pattern */}
        <main className="flex-1 overflow-auto relative z-0">
          {/* Background layer with subtle gradient using design tokens */}
          <div className="min-h-full bg-gradient-to-br from-background via-muted/80 to-accent/30">
            {/* Subtle grid pattern overlay - Swiss style */}
            <div
              className="min-h-full p-8 lg:p-10 swiss-grid"
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

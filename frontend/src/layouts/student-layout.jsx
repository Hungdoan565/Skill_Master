import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '@/components/layout/student-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export function StudentLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Sidebar */}
      <StudentSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - reuse AdminHeader for consistency */}
        <div className="relative z-[100]">
          <AdminHeader />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto relative z-0">
          <div className="min-h-full bg-gradient-to-br from-background via-muted/80 to-accent/30">
            <div className="min-h-full p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


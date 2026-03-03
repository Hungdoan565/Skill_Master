/**
 * OverdueDashboardPage - Page wrapper for OverdueDashboard component
 */

import { OverdueDashboard } from '../components';

export function OverdueDashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OverdueDashboard />
      </div>
    </div>
  );
}

export default OverdueDashboardPage;


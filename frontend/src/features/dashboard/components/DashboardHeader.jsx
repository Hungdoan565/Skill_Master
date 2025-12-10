/**
 * DashboardHeader Component
 * Header của trang dashboard với greeting và refresh button
 */

import { RefreshCw, Download } from 'lucide-react';
import { getGreeting, getCurrentDate } from '../utils';

export function DashboardHeader({ userName, onRefresh, onExport, refreshing = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()} {userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          Tổng quan hoạt động kinh doanh của bạn • {getCurrentDate()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Download size={16} />
            Xuất báo cáo
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>
    </div>
  );
}

export default DashboardHeader;

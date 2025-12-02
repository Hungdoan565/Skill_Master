/**
 * ChartsSection Component
 * Section chứa các biểu đồ - clean design
 */

import { MoreHorizontal } from 'lucide-react';
import { SimpleAreaChart } from './SimpleAreaChart';
import { SimplePieChart } from './SimplePieChart';

export function ChartsSection({ revenueData = [], distributionData = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-28 bg-gray-100 rounded mb-6" />
          <div className="h-[280px] bg-gray-50 rounded-xl" />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-5 w-36 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-24 bg-gray-100 rounded mb-6" />
          <div className="h-[240px] bg-gray-50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Revenue Chart */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Doanh thu theo tháng</h3>
            <p className="text-sm text-gray-500 mt-0.5">12 tháng gần nhất</p>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors -mr-2 -mt-1">
            <MoreHorizontal size={18} className="text-gray-400" />
          </button>
        </div>
        <SimpleAreaChart 
          data={revenueData} 
          dataKey="revenue" 
          height={280}
        />
      </div>

      {/* Distribution Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Phân bố học viên</h3>
            <p className="text-sm text-gray-500 mt-0.5">Theo khóa học</p>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors -mr-2 -mt-1">
            <MoreHorizontal size={18} className="text-gray-400" />
          </button>
        </div>
        <SimplePieChart data={distributionData} />
      </div>
    </div>
  );
}

export default ChartsSection;

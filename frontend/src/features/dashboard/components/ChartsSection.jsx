import { MoreHorizontal } from 'lucide-react';
import { ModernAreaChart } from './ModernAreaChart';
import { ModernPieChart } from './ModernPieChart';

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
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Cân đối tài chính</h3>
            <p className="text-sm text-gray-400 mt-0.5 font-medium">Doanh thu 12 tháng gần nhất</p>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors -mr-2 -mt-1 ring-1 ring-transparent active:ring-gray-100">
            <MoreHorizontal size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 min-h-[300px]">
          <ModernAreaChart
            data={revenueData}
            dataKey="revenue"
            height={300}
          />
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Thị phần khóa học</h3>
            <p className="text-sm text-gray-400 mt-0.5 font-medium">Số lượng học viên theo loại</p>
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors -mr-2 -mt-1">
            <MoreHorizontal size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1">
          <ModernPieChart data={distributionData} />
        </div>
      </div>
    </div>
  );
}

export default ChartsSection;


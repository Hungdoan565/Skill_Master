/**
 * CenterCard Component
 * Card hiển thị trung tâm với stats (số khu, số phòng, sức chứa)
 */

import { Building2, Package, DoorOpen, Users, ChevronRight } from 'lucide-react';

export function CenterCard({ center, stats, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-500/50 transition-all cursor-pointer"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {center.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400">{center.code}</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 dark:text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {/* Số khu */}
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.zones}</span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Khu</p>
                </div>

                {/* Số phòng */}
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <DoorOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.rooms}</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Phòng</p>
                </div>

                {/* Tổng sức chứa */}
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.capacity}</span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">Chỗ</p>
                </div>
            </div>

            {/* Footer */}
            {center.address && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700">
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{center.address}</p>
                </div>
            )}
        </div>
    );
}

export default CenterCard;

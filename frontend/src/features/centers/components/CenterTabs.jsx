/**
 * CenterTabs Component - Tabs navigation cho Center Detail
 */

import React from 'react';
import {
    LayoutDashboard,
    Building2,
    BookOpen,
    Users,
    DollarSign
} from 'lucide-react';

const TABS = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'rooms', label: 'Phòng học', icon: Building2 },
    { id: 'classes', label: 'Lớp học', icon: BookOpen },
    { id: 'staff', label: 'Nhân sự', icon: Users },
    { id: 'revenue', label: 'Doanh thu', icon: DollarSign }
];

export function CenterTabs({ activeTab, onTabChange, counts = {} }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-1 p-1 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const count = counts[tab.id];

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                                transition-all whitespace-nowrap
                                ${isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                            `}
                        >
                            <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                            {tab.label}
                            {count !== undefined && count > 0 && (
                                <span className={`
                                    ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                                    ${isActive
                                        ? 'bg-indigo-200 text-indigo-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }
                                `}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default CenterTabs;

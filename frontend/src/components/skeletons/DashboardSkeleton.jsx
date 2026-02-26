import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Placeholder */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-32 flex flex-col justify-between">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Large Chart Area */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-96 flex flex-col">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
        </div>

        {/* List/Aside Area */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm h-96 flex flex-col">
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
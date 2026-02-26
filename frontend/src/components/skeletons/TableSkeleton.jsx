import React from 'react';

export const TableSkeleton = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Placeholder */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="flex gap-2">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Table Header row */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 grid grid-cols-4 gap-4">
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        
        {/* Table rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 grid grid-cols-4 gap-4 items-center">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
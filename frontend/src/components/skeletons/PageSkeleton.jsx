import React from 'react';

export const PageSkeleton = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Placeholder */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
};
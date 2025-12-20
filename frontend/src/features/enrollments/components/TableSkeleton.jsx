/**
 * TableSkeleton - Loading skeleton cho table
 * Hiển thị placeholder animation khi đang load data
 */

export const TableSkeleton = ({ rows = 5, columns = 8 }) => {
    return (
        <div className="animate-pulse">
            <table className="w-full">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex} className="px-4 py-3">
                                    {colIndex === 0 ? (
                                        // First column: User avatar + info
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-200"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                                                <div className="h-3 bg-slate-100 rounded w-24"></div>
                                            </div>
                                        </div>
                                    ) : colIndex === columns - 1 ? (
                                        // Last column: Actions button
                                        <div className="h-8 w-8 bg-slate-200 rounded"></div>
                                    ) : (
                                        // Other columns: Text
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * StatsCardSkeleton - Loading skeleton cho stats cards
 */
export const StatsCardSkeleton = () => {
    return (
        <div className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-200 h-10 w-10"></div>
                <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
            </div>
        </div>
    );
};

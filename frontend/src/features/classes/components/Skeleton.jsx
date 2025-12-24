/**
 * Skeleton Loading Components
 * Provides skeleton UI for loading states
 */

import { cn } from '@/lib/utils';

// Base skeleton component
export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200",
                className
            )}
            {...props}
        />
    );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }) {
    return (
        <tr className="border-b border-slate-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className={cn(
                        "h-4",
                        i === 0 ? "w-8" : i === 1 ? "w-32" : "w-16"
                    )} />
                </td>
            ))}
        </tr>
    );
}

// Students table skeleton
export function StudentsTableSkeleton({ rows = 5 }) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="w-10 px-4 py-3"><Skeleton className="h-4 w-4" /></th>
                        <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                        <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-32" /></th>
                        <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-24 mx-auto" /></th>
                        <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-20 mx-auto" /></th>
                        <th className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-100">
                            <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-36" />
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                            <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Grades table skeleton
export function GradesTableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-3 py-3 w-12"><Skeleton className="h-4 w-6" /></th>
                        <th className="px-4 py-3 min-w-[200px]"><Skeleton className="h-4 w-24" /></th>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-3 py-3 min-w-[100px]">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-16 mx-auto" />
                                    <Skeleton className="h-3 w-12 mx-auto" />
                                </div>
                            </th>
                        ))}
                        <th className="px-3 py-3 min-w-[90px] bg-indigo-50"><Skeleton className="h-4 w-14 mx-auto" /></th>
                        <th className="px-3 py-3 min-w-[80px]"><Skeleton className="h-4 w-12 mx-auto" /></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-100">
                            <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            </td>
                            {Array.from({ length: columns }).map((_, j) => (
                                <td key={j} className="px-3 py-3 text-center">
                                    <Skeleton className="h-7 w-14 mx-auto rounded" />
                                </td>
                            ))}
                            <td className="px-3 py-3 text-center bg-indigo-50">
                                <Skeleton className="h-5 w-12 mx-auto" />
                            </td>
                            <td className="px-3 py-3 text-center">
                                <Skeleton className="h-6 w-14 mx-auto rounded-full" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Sessions list skeleton
export function SessionsListSkeleton({ count = 5 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            ))}
        </div>
    );
}

// Performance stats skeleton
export function PerformanceStatsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg">
                <Skeleton className="h-5 w-40 mb-4" />
                <Skeleton className="h-64 w-full rounded" />
            </div>
        </div>
    );
}

// Card skeleton
export function CardSkeleton({ className }) {
    return (
        <div className={cn("p-6 bg-white border border-slate-200 rounded-lg space-y-4", className)}>
            <Skeleton className="h-6 w-40" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    );
}

// Header skeleton with tabs
export function HeaderSkeleton() {
    return (
        <div className="space-y-4">
            {/* Back button and title */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded" />
                <div className="space-y-1.5">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 pb-px">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-28 rounded-t" />
                ))}
            </div>
        </div>
    );
}

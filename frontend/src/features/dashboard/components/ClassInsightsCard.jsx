/**
 * ClassInsightsCard - Compact class insights for Dashboard
 * 
 * UPGRADED: Uses data passed from parent (Dashboard) instead of fetching independently
 * This eliminates redundant API calls and improves performance
 * 
 * Shows:
 * - Fill rate overview
 * - Low enrollment alerts
 * - Quick link to Reports for deep dive
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    GraduationCap,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
    Users,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * ClassInsightsCard Component
 * @param {Array} classes - Classes data passed from parent (from useClassesList hook)
 * @param {boolean} loading - Loading state from parent
 * @param {function} onRefresh - Optional callback to refresh data
 */
export function ClassInsightsCard({ classes = [], loading = false, onRefresh }) {

    const insights = useMemo(() => {
        // Filter for active classes (ongoing = đang học, upcoming = sắp mở)
        const activeClasses = classes.filter(c => c.status === 'ongoing' || c.status === 'upcoming');

        // Calculate fill rate
        const totalCapacity = activeClasses.reduce((sum, c) => sum + (c.max_students || 0), 0);
        const totalEnrolled = activeClasses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
        const avgFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

        // Low enrollment classes (< 30% fill rate)
        const lowEnrollment = activeClasses.filter(c => {
            const fillRate = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
            return fillRate < 0.3;
        });

        // Near full classes (> 90% fill rate)
        const nearFull = activeClasses.filter(c => {
            const fillRate = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
            return fillRate >= 0.9;
        });

        return {
            activeCount: activeClasses.length,
            avgFillRate,
            lowEnrollment,
            nearFull,
            totalCapacity,
            totalEnrolled
        };
    }, [classes]);

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center h-32">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                        <div className="text-sm text-gray-500">Đang tải...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                        Insights Lớp học
                    </CardTitle>
                    <Link to="/admin/reports/grades">
                        <Button variant="ghost" size="sm" className="text-xs">
                            Xem chi tiết
                            <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Fill Rate Overview */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                    <div>
                        <p className="text-xs text-gray-600 mb-1">Tỷ lệ lấp đầy trung bình</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-indigo-600">
                                {insights.avgFillRate}%
                            </span>
                            <span className="text-xs text-gray-500">
                                ({insights.totalEnrolled}/{insights.totalCapacity} chỗ)
                            </span>
                        </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                        <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Active Classes */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Lớp đang học</p>
                        <p className="text-xl font-bold text-gray-900">{insights.activeCount}</p>
                    </div>

                    {/* Near Full */}
                    <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 mb-1">Gần đầy (&gt;90%)</p>
                        <p className="text-xl font-bold text-green-700">{insights.nearFull.length}</p>
                    </div>
                </div>

                {/* Low Enrollment Alert */}
                {insights.lowEnrollment.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-900">
                                    {insights.lowEnrollment.length} lớp cần chú ý
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Tỷ lệ ghi danh thấp (&lt;30%)
                                </p>
                                {insights.lowEnrollment.slice(0, 2).map(cls => (
                                    <div key={cls.id} className="mt-2 flex items-center justify-between">
                                        <Link
                                            to={`/admin/classes/${cls.id}`}
                                            className="text-xs text-amber-800 hover:underline truncate"
                                        >
                                            {cls.name}
                                        </Link>
                                        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                                            {cls.enrolled_count}/{cls.max_students}
                                        </Badge>
                                    </div>
                                ))}
                                {insights.lowEnrollment.length > 2 && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        +{insights.lowEnrollment.length - 2} lớp khác
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="pt-2 border-t space-y-2">
                    <Link to="/admin/reports/attendance">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Báo cáo chuyên cần
                            <ArrowRight className="h-3 w-3 ml-auto" />
                        </Button>
                    </Link>
                    <Link to="/admin/reports/grades">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                            <Users className="h-4 w-4 mr-2" />
                            Báo cáo điểm số
                            <ArrowRight className="h-3 w-3 ml-auto" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

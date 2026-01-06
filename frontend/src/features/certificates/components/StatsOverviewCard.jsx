/**
 * StatsOverviewCard - Certificate stats overview component
 * Extracted from CertificatesPage
 */

import { Award, CheckCircle, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function StatsOverviewCard({ totalTypes, totalIssued, last30Days, topType }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Card className="border-l-4 border-indigo-500">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                            <Award className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Loại chứng chỉ</p>
                            <p className="text-xl font-bold text-slate-900">{totalTypes}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-green-500">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Đã cấp</p>
                            <p className="text-xl font-bold text-slate-900">{totalIssued}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">30 ngày qua</p>
                            <p className="text-xl font-bold text-slate-900">{last30Days}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-yellow-500">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                            <Star className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500">Phổ biến nhất</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{topType || '-'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default StatsOverviewCard;

/**
 * CertificateTypeCard - Card component for displaying certificate type
 * Extracted from CertificatesPage
 */

import { ChevronRight, Users, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_CONFIG, PROVIDER_LOGOS } from '../constants';

export function CertificateTypeCard({ type, onClick, viewMode = 'grid' }) {
    const config = CATEGORY_CONFIG[type.category] || CATEGORY_CONFIG.other;
    const Icon = config.icon;
    const studentCount = type.stats?.total || 0;

    if (viewMode === 'list') {
        return (
            <div
                className="flex items-center gap-4 p-3 bg-white rounded-lg border hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
                onClick={onClick}
            >
                <div className={`h-10 w-10 rounded-lg ${config.bgLight} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${config.textColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 truncate">{type.name}</h3>
                        {type.is_external ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">Ngoài</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-200">Nội bộ</Badge>
                        )}
                    </div>
                    {type.provider && (
                        <p className="text-xs text-slate-500 truncate">{type.provider}</p>
                    )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${studentCount > 0 ? 'bg-green-50' : 'bg-slate-50'}`}>
                        <Users className={`h-3.5 w-3.5 ${studentCount > 0 ? 'text-green-600' : 'text-slate-400'}`} />
                        <span className={`text-sm font-semibold ${studentCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                            {studentCount}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <Card
            className="hover:shadow-lg transition-all cursor-pointer group border-l-4 hover:scale-[1.02]"
            style={{ borderLeftColor: type.is_external ? '#3b82f6' : '#22c55e' }}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`h-12 w-12 rounded-lg ${config.bgLight} flex items-center justify-center flex-shrink-0`}>
                            {type.template_preview_url ? (
                                <img
                                    src={type.template_preview_url}
                                    alt={type.name}
                                    className="h-8 w-8 object-contain"
                                />
                            ) : (
                                <span className="text-xl">
                                    {PROVIDER_LOGOS[type.provider] || <Icon className={`h-6 w-6 ${config.textColor}`} />}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 text-base leading-tight flex-1">
                                    {type.name}
                                </h3>
                                {type.is_external ? (
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 flex-shrink-0">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Bên ngoài
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 flex-shrink-0">
                                        Nội bộ
                                    </Badge>
                                )}
                            </div>

                            {type.provider && (
                                <p className="text-xs text-slate-500 mb-2 truncate">
                                    {type.provider}
                                </p>
                            )}

                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${studentCount > 0 ? 'bg-green-50' : 'bg-slate-50'}`}>
                                    <Users className={`h-3.5 w-3.5 ${studentCount > 0 ? 'text-green-500' : 'text-slate-400'}`} />
                                    <span className={`font-semibold ${studentCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                                        {studentCount}
                                    </span>
                                    <span className="text-slate-500">học viên</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}

export default CertificateTypeCard;

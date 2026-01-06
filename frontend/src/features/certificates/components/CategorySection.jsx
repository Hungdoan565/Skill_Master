/**
 * CategorySection - Collapsible category section for certificate types
 * Extracted from CertificatesPage
 */

import { useState } from 'react';
import { ChevronUp, ChevronDown, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CertificateTypeCard } from './CertificateTypeCard';

export function CategorySection({ category, types, config, onTypeClick, viewMode, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const CategoryIcon = config.icon;
    const totalStudents = types.reduce((sum, t) => sum + (t.stats?.total || 0), 0);
    const activeTypes = types.filter(t => t.stats?.total > 0).length;

    return (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Category Header - Clickable */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderLeft: `4px solid ${config.borderColor}` }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={`p-2 rounded-lg ${config.bgLight}`}>
                    <CategoryIcon className={`h-5 w-5 ${config.textColor}`} />
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900">{config.label}</h2>
                    <p className="text-xs text-slate-500">
                        {types.length} loại • {activeTypes} có học viên • Tổng: {totalStudents} học viên
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {totalStudents > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                            <Users className="h-3 w-3 mr-1" />
                            {totalStudents}
                        </Badge>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Category Content */}
            {isExpanded && (
                <div className={`p-4 pt-0 ${viewMode === 'list' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'}`}>
                    {types.map(type => (
                        <CertificateTypeCard
                            key={type.id}
                            type={type}
                            onClick={() => onTypeClick(type)}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CategorySection;

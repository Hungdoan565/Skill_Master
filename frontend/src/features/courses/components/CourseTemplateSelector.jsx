/**
 * CourseTemplateSelector - Chọn mẫu khóa học nhanh
 */

import { useState } from 'react';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COURSE_TEMPLATES } from '../utils';

export function CourseTemplateSelector({ onSelectTemplate, onSkip }) {
    const [selectedId, setSelectedId] = useState(null);

    const handleSelect = (template) => {
        setSelectedId(template.id);
    };

    const handleApply = () => {
        const template = COURSE_TEMPLATES.find(t => t.id === selectedId);
        if (template) {
            onSelectTemplate?.(template.data);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Chọn mẫu để bắt đầu nhanh</span>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COURSE_TEMPLATES.map((template) => {
                    const IconComponent = template.icon;
                    return (
                        <button
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className={`relative p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${selectedId === template.id
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md'
                                : 'border-border hover:border-border bg-card'
                                }`}
                        >
                            {selectedId === template.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            <div className={`w-10 h-10 rounded-lg ${template.bgColor} flex items-center justify-center mb-2`}>
                                <IconComponent className={`w-5 h-5 ${template.color}`} />
                            </div>
                            <h4 className="font-medium text-sm text-foreground mb-0.5">{template.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                        </button>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-muted-foreground"
                >
                    Bỏ qua, tự nhập
                </Button>

                <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!selectedId}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                    Áp dụng mẫu
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

export default CourseTemplateSelector;

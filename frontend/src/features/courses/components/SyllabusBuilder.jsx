/**
 * SyllabusBuilder - Component for managing course syllabus (Modules & Topics)
 */

import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function SyllabusBuilder({
    syllabus = [],
    onAddModule,
    onUpdateModule,
    onRemoveModule,
    onAddTopic,
    onUpdateTopic,
    onRemoveTopic
}) {
    const [expandedModules, setExpandedModules] = useState([0]); // Expand first module by default

    const toggleModule = (index) => {
        setExpandedModules(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Cấu trúc chương trình</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddModule}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Module
                </Button>
            </div>

            <div className="space-y-4">
                {syllabus.map((module, mIndex) => {
                    const isExpanded = expandedModules.includes(mIndex);

                    return (
                        <div
                            key={mIndex}
                            className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden"
                        >
                            {/* Module Header */}
                            <div className="flex items-center gap-3 p-4 bg-zinc-50/50 border-b border-zinc-200">
                                <div className="cursor-move opacity-40">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 flex items-center gap-4">
                                    <span className="text-xs font-mono font-bold text-zinc-400">0{mIndex + 1}</span>
                                    <Input
                                        value={module.title}
                                        onChange={(e) => onUpdateModule(mIndex, 'title', e.target.value)}
                                        placeholder="Tên Module (VD: Listening Fundamentals)"
                                        className="flex-1 bg-transparent border-none font-medium h-auto p-0 focus-visible:ring-0"
                                    />
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => toggleModule(mIndex)}
                                        className="p-1.5 text-zinc-500 hover:bg-zinc-200 rounded-md transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveModule(mIndex)}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Topics List (Collapsible) */}
                            {isExpanded && (
                                <div className="p-4 space-y-3 bg-white">
                                    {module.topics.map((topic, tIndex) => (
                                        <div key={tIndex} className="flex items-center gap-3 group">
                                            <div className="w-6 flex justify-center">
                                                <FileText className="w-3.5 h-3.5 text-zinc-300" />
                                            </div>
                                            <Input
                                                value={topic}
                                                onChange={(e) => onUpdateTopic(mIndex, tIndex, e.target.value)}
                                                placeholder="Tên bài học/Chủ đề"
                                                className="flex-1 h-9 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onRemoveTopic(mIndex, tIndex)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => onAddTopic(mIndex)}
                                        className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 w-fit pl-9 pt-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm bài học
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {syllabus.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                        <p className="text-sm text-zinc-500">Chưa có nội dung chương trình học. Nhấn "Thêm Module" để bắt đầu.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SyllabusBuilder;

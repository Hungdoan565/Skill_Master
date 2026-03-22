/**
 * FaqBuilder - Component for managing course FAQ items
 */

import { Plus, Trash2, HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FaqBuilder({
    faq = [],
    onAdd,
    onUpdate,
    onRemove
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Câu hỏi thường gặp</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAdd()}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm câu hỏi
                </Button>
            </div>

            <div className="space-y-4">
                {faq.map((item, index) => (
                    <div
                        key={index}
                        className="p-4 bg-card border border-border rounded-xl shadow-sm space-y-4 relative group"
                    >
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid gap-4 pr-8">
                            {/* Question */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    Câu hỏi {index + 1}
                                </Label>
                                <Input
                                    value={item.question}
                                    onChange={(e) => onUpdate(index, 'question', e.target.value)}
                                    placeholder="VD: Khóa học này kéo dài bao lâu?"
                                    className="font-medium"
                                />
                            </div>

                            {/* Answer */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Câu trả lời
                                </Label>
                                <textarea
                                    value={item.answer}
                                    onChange={(e) => onUpdate(index, 'answer', e.target.value)}
                                    placeholder="Nhập nội dung câu trả lời..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {faq.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Chưa có câu hỏi FAQ nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FaqBuilder;

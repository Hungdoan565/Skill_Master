/**
 * JsonArrayInput - Generic component for managing array of strings
 * Used for Outcomes and Features tabs
 */

import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function JsonArrayInput({
    items = [],
    onAdd,
    onUpdate,
    onRemove,
    placeholder = 'Nhập nội dung...',
    emptyMessage = 'Chưa có mục nào. Nhấn "Thêm" để bắt đầu.',
    label = 'Mục'
}) {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="space-y-4">
            {/* List of items */}
            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="group flex items-start gap-2 p-3 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                        >
                            <div className="pt-2 cursor-move opacity-0 group-hover:opacity-40 transition-opacity">
                                <GripVertical className="w-4 h-4 text-neutral-400" />
                            </div>

                            <div className="flex-1">
                                <Input
                                    value={item}
                                    onChange={(e) => onUpdate(index, e.target.value)}
                                    placeholder={placeholder}
                                    className="border-none shadow-none p-0 h-auto focus-visible:ring-0"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="mt-1 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                aria-label={`Xóa ${label.toLowerCase()} ${index + 1}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
                    <p className="text-sm text-neutral-500">{emptyMessage}</p>
                </div>
            )}

            {/* Add new item */}
            <div className="flex gap-2">
                <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="flex-1"
                />
                <Button
                    type="button"
                    onClick={handleAdd}
                    variant="outline"
                    className="shrink-0"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm
                </Button>
            </div>
        </div>
    );
}

export default JsonArrayInput;

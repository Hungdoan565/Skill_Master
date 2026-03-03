/**
 * KeyboardShortcutsModal Component
 * Shows available keyboard shortcuts for the current view
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHORTCUTS = {
    grades: [
        { keys: ['Tab'], description: 'Di chuyển sang ô tiếp theo' },
        { keys: ['Shift', 'Tab'], description: 'Di chuyển về ô trước' },
        { keys: ['↑'], description: 'Di chuyển lên hàng trên' },
        { keys: ['↓'], description: 'Di chuyển xuống hàng dưới' },
        { keys: ['←'], description: 'Di chuyển sang trái' },
        { keys: ['→'], description: 'Di chuyển sang phải' },
        { keys: ['Enter'], description: 'Lưu và thoát ô' },
        { keys: ['Esc'], description: 'Hủy và thoát ô' },
    ],
    general: [
        { keys: ['?'], description: 'Mở/đóng hướng dẫn phím tắt' },
        { keys: ['Ctrl', 'S'], description: 'Lưu thay đổi (nếu có)' },
        { keys: ['Esc'], description: 'Đóng modal/dialog' },
    ],
    navigation: [
        { keys: ['1'], description: 'Chuyển tab Học viên' },
        { keys: ['2'], description: 'Chuyển tab Lịch trình' },
        { keys: ['3'], description: 'Chuyển tab Điểm' },
        { keys: ['4'], description: 'Chuyển tab Hiệu suất' },
    ],
    students: [
        { keys: ['Ctrl', 'F'], description: 'Tìm kiếm học viên' },
        { keys: ['Space'], description: 'Chọn/bỏ chọn học viên' },
        { keys: ['Ctrl', 'A'], description: 'Chọn tất cả' },
    ]
};

export function KeyboardShortcutsModal({ isOpen, onClose, activeTab = 'grades' }) {
    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const activeShortcuts = SHORTCUTS[activeTab] || SHORTCUTS.general;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Keyboard className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Phím tắt</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Tab-specific shortcuts */}
                    <ShortcutSection
                        title={getTabTitle(activeTab)}
                        shortcuts={activeShortcuts}
                    />

                    {/* General shortcuts */}
                    {activeTab !== 'general' && (
                        <ShortcutSection
                            title="Phím tắt chung"
                            shortcuts={SHORTCUTS.general}
                            className="mt-6"
                        />
                    )}

                    {/* Navigation shortcuts */}
                    <ShortcutSection
                        title="Điều hướng tab"
                        shortcuts={SHORTCUTS.navigation}
                        className="mt-6"
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-500 text-center">
                        Nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">?</kbd> bất kỳ lúc nào để mở hướng dẫn này
                    </p>
                </div>
            </div>
        </div>
    );
}

function ShortcutSection({ title, shortcuts, className = '' }) {
    return (
        <div className={className}>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
            <div className="space-y-2">
                {shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="text-sm text-slate-600">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIdx) => (
                                <span key={keyIdx} className="flex items-center">
                                    {keyIdx > 0 && <span className="text-slate-400 mx-1">+</span>}
                                    <Key>{key}</Key>
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Key({ children }) {
    // Handle special keys
    const isArrow = children.startsWith('↑') || children.startsWith('↓') || children.startsWith('←') || children.startsWith('→');
    const isModifier = ['Ctrl', 'Shift', 'Alt', 'Command'].includes(children);

    return (
        <kbd className={`
      inline-flex items-center justify-center min-w-[28px] h-7 px-2
      bg-slate-100 border border-slate-300 rounded-md
      text-xs font-semibold text-slate-700 shadow-sm
      ${isArrow ? 'font-mono text-base' : ''}
      ${isModifier ? 'bg-slate-200' : ''}
    `}>
            {children === 'Command' ? <Command className="w-3 h-3" /> : children}
        </kbd>
    );
}

function getTabTitle(tab) {
    switch (tab) {
        case 'students': return 'Tab Học viên';
        case 'schedule': return 'Tab Lịch trình';
        case 'grades': return 'Tab Điểm';
        case 'performance': return 'Tab Hiệu suất';
        default: return 'Phím tắt';
    }
}

/**
 * Hook for keyboard shortcuts help
 */
export function useKeyboardShortcuts(activeTab = 'grades') {
    const [showHelp, setShowHelp] = useState(false);

    const handleGlobalKeyDown = useCallback((e) => {
        // ? key to toggle help modal
        if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            setShowHelp(prev => !prev);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    return {
        showHelp,
        setShowHelp,
        openHelp: () => setShowHelp(true),
        closeHelp: () => setShowHelp(false)
    };
}

/**
 * Keyboard Shortcuts Dialog
 * 
 * Modal showing all available keyboard shortcuts
 */

import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { getShortcutGroups } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

// Keyboard key component
function Key({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
        'rounded-md border border-zinc-300 bg-zinc-100',
        'text-xs font-medium text-zinc-700',
        'shadow-sm',
        className
      )}
    >
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }) {
  const shortcutGroups = getShortcutGroups();

  // Listen for ? key to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '?' && !open) {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" 
        onClick={() => onOpenChange(false)} 
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <Keyboard className="h-5 w-5 text-zinc-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Phím tắt</h2>
                <p className="text-sm text-zinc-500">Điều hướng nhanh bằng bàn phím</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 
                         hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50"
                    >
                      <span className="text-sm text-zinc-700">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <Key key={keyIndex}>{key}</Key>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
            <p className="text-xs text-zinc-500 text-center">
              Nhấn <Key>?</Key> bất cứ lúc nào để mở bảng phím tắt này
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default KeyboardShortcutsDialog;

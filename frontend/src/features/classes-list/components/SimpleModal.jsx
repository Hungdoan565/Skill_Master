/**
 * SimpleModal Component - Modal wrapper đơn giản
 */

import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-7xl'
};

export function SimpleModal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const titleId = useId();

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div 
      ref={overlayRef} 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative w-full ${sizeClass} transform rounded-xl bg-white dark:bg-slate-800 shadow-2xl dark:shadow-black/40 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shrink-0">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SimpleModal;

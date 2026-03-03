/**
 * Sheet Component (Drawer/Slide-over Panel)
 * 
 * A drawer-style panel that slides in from the side.
 * Used for detail views, forms, and actions while keeping context visible.
 * 
 * @usage
 * <Sheet open={isOpen} onOpenChange={setIsOpen}>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Title</SheetTitle>
 *       <SheetDescription>Description</SheetDescription>
 *     </SheetHeader>
 *     ... content ...
 *   </SheetContent>
 * </Sheet>
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = ({ open, onOpenChange, children }) => {
    // Lock body scroll when sheet is open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    // Handle ESC key to close
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && open) {
                onOpenChange?.(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[300]">
            {/* Backdrop - SOLID dark overlay, no blur to keep crisp edges */}
            <div
                className="fixed inset-0 bg-black/60 transition-opacity"
                onClick={() => onOpenChange?.(false)}
                aria-hidden="true"
            />
            {/* Content wrapper */}
            {children}
        </div>
    );
};

const sheetVariants = {
    top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
    bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
    // Right variant: Start BELOW navbar (top-16 = 64px) to avoid overlap
    right: 'top-16 bottom-0 right-0 w-full sm:w-[480px] md:w-[540px]',
};

const SheetContent = React.forwardRef(
    ({ side = 'right', className, children, onClose, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    // SOLID background - no transparency!
                    'fixed z-50 flex flex-col',
                    'bg-white dark:bg-zinc-950',
                    // Deep shadow to separate from background
                    'shadow-2xl',
                    // Explicit border for crisp edge
                    'border-l border-zinc-200 dark:border-zinc-800',
                    'animate-in slide-in-from-right duration-300 ease-out',
                    sheetVariants[side],
                    className
                )}
                {...props}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background 
                     transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 
                     focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        );
    }
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }) => (
    <div
        className={cn('flex flex-col gap-1.5 p-6 pb-0', className)}
        {...props}
    />
);

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn('text-lg font-semibold text-foreground', className)}
        {...props}
    />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
SheetDescription.displayName = 'SheetDescription';

const SheetBody = ({ className, ...props }) => (
    <div className={cn('flex-1 p-6', className)} {...props} />
);

const SheetFooter = ({ className, ...props }) => (
    <div
        className={cn(
            'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-0 border-t bg-muted/30',
            className
        )}
        {...props}
    />
);

export {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetBody,
    SheetFooter,
};

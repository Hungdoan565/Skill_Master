/**
 * AlertDialog Component
 * 
 * Shadcn-style alert dialog for confirmations
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const AlertDialog = ({ open, onOpenChange, children }) => {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-[60]">{children}</div>
    </div>
  );
};

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative rounded-lg shadow-2xl p-6 w-full max-w-md',
      'bg-white dark:bg-zinc-950',
      'border border-zinc-200 dark:border-zinc-800',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left mb-4', className)}
    {...props}
  />
);

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

const AlertDialogFooter = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)}
    {...props}
  />
);

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2',
      'bg-primary text-primary-foreground hover:bg-primary/90',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'transition-colors',
      className
    )}
    {...props}
  />
));
AlertDialogAction.displayName = 'AlertDialogAction';

const AlertDialogCancel = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2',
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'transition-colors mt-2 sm:mt-0',
      className
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};

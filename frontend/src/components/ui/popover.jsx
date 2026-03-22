/**
 * Popover Component
 * 
 * Shadcn-style popover component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const PopoverContext = React.createContext({
  open: false,
  setOpen: () => {},
});

const Popover = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext);
  
  const child = React.Children.only(children);
  
  return React.cloneElement(child, {
    ...props,
    ref,
    onClick: (e) => {
      setOpen(!open);
      child.props.onClick?.(e);
    },
  });
});
PopoverTrigger.displayName = 'PopoverTrigger';

const PopoverContent = React.forwardRef(({ className, align = 'center', children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext);
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="relative z-50">
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'absolute mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-lg outline-none',
          align === 'start' && 'left-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'end' && 'right-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };

/**
 * Checkbox Component - shadcn/ui compatible
 */

import * as React from "react";
import { Check, Minus } from "lucide-react";

const Checkbox = React.forwardRef(
    ({ className = "", checked, indeterminate, onCheckedChange, disabled, ...props }, ref) => {
        const inputRef = React.useRef(null);

        // Forward ref to input
        React.useImperativeHandle(ref, () => inputRef.current);

        const handleChange = (e) => {
            if (disabled) return;
            onCheckedChange?.(e.target.checked);
        };

        const handleClick = (e) => {
            // Prevent double-firing when clicking directly on input
            if (e.target === inputRef.current) return;
            if (disabled) return;
            inputRef.current?.click();
        };

        return (
            <div
                className={`relative inline-flex items-center justify-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={handleClick}
            >
                <input
                    type="checkbox"
                    ref={inputRef}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className="sr-only peer"
                    {...props}
                />
                <div
                    className={`
            h-4 w-4 shrink-0 rounded border border-slate-300
            peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-focus-visible:ring-offset-2
            peer-disabled:cursor-not-allowed peer-disabled:opacity-50
            ${checked || indeterminate ? 'bg-red-500 border-red-500 text-white' : 'bg-white'}
            ${className}
            transition-colors flex items-center justify-center
          `}
                >
                    {checked && !indeterminate && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                    {indeterminate && (
                        <Minus className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                </div>
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

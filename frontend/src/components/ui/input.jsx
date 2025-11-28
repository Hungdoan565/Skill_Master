import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base styles - tăng chiều cao h-11 (44px) cho dễ bấm
        "flex h-11 w-full rounded-md border-2 border-slate-200 bg-white px-4 py-2 text-base",
        // Placeholder đậm hơn để dễ đọc (accessibility)
        "placeholder:text-slate-400",
        // Transition mượt mà cho tất cả interactions
        "transition-all duration-200 ease-in-out",
        // Focus state - viền indigo + ring rõ ràng
        "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
        // Hover state nhẹ
        "hover:border-slate-300",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
        // File input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

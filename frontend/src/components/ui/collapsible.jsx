import * as React from "react"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

function Collapsible({ children, defaultOpen = false, open: controlledOpen, onOpenChange, className }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const toggle = () => {
    if (isControlled) {
      onOpenChange?.(!isOpen);
    } else {
      setInternalOpen(!isOpen);
    }
  };

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className={className}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

const CollapsibleContext = React.createContext({ isOpen: false, toggle: () => {} });

function CollapsibleTrigger({ children, className, asChild = false }) {
  const { isOpen, toggle } = React.useContext(CollapsibleContext);

  if (asChild) {
    return React.cloneElement(children, { onClick: toggle, 'data-state': isOpen ? 'open' : 'closed' });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn("w-full text-left", className)}
    >
      {children}
    </button>
  )
}

function CollapsibleContent({ children, className }) {
  const { isOpen } = React.useContext(CollapsibleContext);

  if (!isOpen) return null;

  return (
    <div className={cn("animate-in fade-in-0 slide-in-from-top-1", className)}>
      {children}
    </div>
  )
}

/**
 * CollapsibleSection — Settings-specific compound component
 * Combines Card + Collapsible for grouped settings sections
 */
function CollapsibleSection({ title, icon: Icon, badge, defaultOpen = false, children, className }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
          <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
          {badge}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t dark:border-slate-800 animate-in fade-in-0 slide-in-from-top-1">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </Card>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleSection }

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, MapPin } from 'lucide-react';
import { useCenterContext } from '@/contexts/center-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

export function CenterSwitcher() {
  const { isSuperAdmin } = useAuth();
  const { selectedCenterId, selectCenter, centers, loading } = useCenterContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Only render for SUPER_ADMIN
  if (!isSuperAdmin?.()) return null;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCenter = centers.find(c => c.id === selectedCenterId);
  const displayText = selectedCenter?.name || 'Tất cả trung tâm';

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 animate-pulse">
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
          "border border-input bg-background hover:bg-muted/80",
          "max-w-[240px]",
          isOpen && "bg-muted/80 border-primary/30 ring-2 ring-primary/20"
        )}
      >
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate text-foreground">{displayText}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      <div className={cn(
        "absolute left-0 top-full mt-2 w-72 rounded-xl border border-border bg-white shadow-lg shadow-black/5 z-[101] transition-all duration-200 ease-out",
        isOpen
          ? "opacity-100 scale-100 translate-y-0 visible"
          : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
      )}>
        {/* Header */}
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chọn trung tâm</p>
        </div>

        <div className="py-1">
          {/* All Centers Option */}
          <button
            onClick={() => { selectCenter(null); setIsOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
              !selectedCenterId
                ? "bg-primary/5 text-primary font-medium"
                : "text-foreground hover:bg-muted"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              !selectedCenterId ? "bg-primary/10" : "bg-muted"
            )}>
              <Building2 className={cn("h-4 w-4", !selectedCenterId ? "text-primary" : "text-muted-foreground")} />
            </div>
            <span>Tất cả trung tâm</span>
            {!selectedCenterId && <Check className="h-4 w-4 ml-auto text-primary" />}
          </button>

          {/* Divider */}
          <div className="my-1 mx-3 border-t border-border" />

          {/* Individual Centers */}
          {centers.map((center) => (
            <button
              key={center.id}
              onClick={() => { selectCenter(center.id); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                selectedCenterId === center.id
                  ? "bg-primary/5 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                selectedCenterId === center.id ? "bg-primary/10" : "bg-muted"
              )}>
                <MapPin className={cn("h-4 w-4", selectedCenterId === center.id ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate">{center.name}</p>
                {center.address && (
                  <p className="text-xs text-muted-foreground truncate">{center.address}</p>
                )}
              </div>
              {selectedCenterId === center.id && <Check className="h-4 w-4 ml-auto text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

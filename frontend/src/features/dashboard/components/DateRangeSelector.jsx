/**
 * DateRangeSelector Component
 * Quick date range selector for dashboard filtering
 */

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

const PRESET_RANGES = [
  { id: 'this_month', label: 'Tháng này', getValue: () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now
    };
  }},
  { id: 'last_month', label: 'Tháng trước', getValue: () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start: lastMonth,
      end: lastDay
    };
  }},
  { id: 'last_3_months', label: '3 tháng gần đây', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return {
      start,
      end: now
    };
  }},
  { id: 'this_year', label: 'Năm nay', getValue: () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: now
    };
  }},
];

export function DateRangeSelector({ selectedRange = 'this_month', onRangeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRange = PRESET_RANGES.find(r => r.id === selectedRange) || PRESET_RANGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted hover:border-border transition-colors min-w-[160px]"
      >
        <Calendar size={16} className="text-muted-foreground" />
        <span className="flex-1 text-left">{currentRange.label}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-card border border-border rounded-xl shadow-lg py-1 right-0">
          {PRESET_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => {
                onRangeChange(range.id, range.getValue());
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                selectedRange === range.id ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-foreground'
              }`}
            >
              <Calendar size={16} className={selectedRange === range.id ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'} />
              <span className="flex-1 text-left">{range.label}</span>
              {selectedRange === range.id && <Check size={16} className="text-orange-500 dark:text-orange-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DateRangeSelector;


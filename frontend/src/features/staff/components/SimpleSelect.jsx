/**
 * SimpleSelect Component
 * Select dropdown đơn giản
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SimpleSelect({ value, onChange, options, placeholder, triggerClassName = '', contentClassName = '' }) {
  const mappedValue = (value === "" || value === null || value === undefined) ? "none" : value;
  
  const handleValueChange = (val) => {
    onChange(val === "none" ? "" : val);
  };

  return (
    <Select value={mappedValue} onValueChange={handleValueChange}>
      <SelectTrigger className={`w-full ${triggerClassName}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        <SelectItem value="none">{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SimpleSelect;

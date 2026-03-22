/**
 * TimeSelect Component - Custom 24h time select dropdown
 * Replaces native <input type="time"> with a consistent, 
 * 24-hour format select dropdown with 30-minute intervals.
 * 
 * Usage:
 *   <TimeSelect value="08:00" onChange={(val) => setValue(val)} />
 *   <TimeSelect value="21:00" onChange={handleChange} step={15} />
 */

import React, { useMemo } from 'react';

// Generate time slots
function generateTimeSlots(step = 30, startHour = 0, endHour = 24) {
    const slots = [];
    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += step) {
            const hh = String(h).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            slots.push(`${hh}:${mm}`);
        }
    }
    // Add the end boundary (e.g., 24:00 as 00:00 next day is excluded)
    return slots;
}

export function TimeSelect({
    value = '',
    onChange,
    disabled = false,
    className = '',
    step = 30,        // interval in minutes: 15 or 30
    startHour = 6,    // earliest selectable hour
    endHour = 24,     // latest selectable hour
    placeholder = 'Chọn giờ',
    id,
    name,
}) {
    const timeSlots = useMemo(
        () => generateTimeSlots(step, startHour, endHour),
        [step, startHour, endHour]
    );

    // Normalize value to match generated slots (e.g., "8:00" -> "08:00")
    const normalizedValue = useMemo(() => {
        if (!value) return '';
        const parts = value.split(':');
        if (parts.length < 2) return value;
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }, [value]);

    // If current value is not in the slot list, add it so it shows
    const options = useMemo(() => {
        if (normalizedValue && !timeSlots.includes(normalizedValue)) {
            return [...timeSlots, normalizedValue].sort();
        }
        return timeSlots;
    }, [timeSlots, normalizedValue]);

    return (
        <select
            id={id}
            name={name}
            value={normalizedValue}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={`px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400
                dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 
                dark:disabled:bg-slate-800 dark:disabled:text-slate-500
                appearance-none cursor-pointer
                ${className}`}
            style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '0.75em 0.75em',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
            }}
        >
            <option value="" disabled className="dark:bg-slate-900">
                {placeholder}
            </option>
            {options.map((slot) => (
                <option key={slot} value={slot} className="dark:bg-slate-900">
                    {slot}
                </option>
            ))}
        </select>
    );
}

export default TimeSelect;

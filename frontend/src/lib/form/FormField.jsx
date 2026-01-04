/**
 * FormField Component
 * 
 * Reusable form field wrapper với React Hook Form integration
 * Supports: Input, Textarea, Select với validation errors
 * 
 * @example
 * <FormField
 *   control={form.control}
 *   name="email"
 *   label="Email"
 *   type="email"
 *   placeholder="name@example.com"
 * />
 */

import * as React from 'react';
import { Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

// ============================================
// FORM FIELD WRAPPER
// ============================================

export function FormField({
  control,
  name,
  label,
  description,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  className,
  inputClassName,
  children,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('space-y-2', className)}>
          {/* Label */}
          {label && (
            <Label 
              htmlFor={name}
              className={cn(
                'text-sm font-medium text-slate-700',
                error && 'text-red-600'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}

          {/* Input or custom children */}
          {children ? (
            React.cloneElement(children, {
              ...field,
              id: name,
              disabled,
              'aria-invalid': !!error,
              'aria-describedby': error ? `${name}-error` : undefined,
            })
          ) : (
            <Input
              {...field}
              {...props}
              id={name}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                inputClassName
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${name}-error` : undefined}
            />
          )}

          {/* Description */}
          {description && !error && (
            <p className="text-xs text-slate-500">{description}</p>
          )}

          {/* Error message */}
          {error && (
            <div 
              id={`${name}-error`}
              className="flex items-center gap-1.5 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}
        </div>
      )}
    />
  );
}

// ============================================
// FORM INPUT (Simplified version)
// ============================================

export function FormInput({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  description,
  className,
  ...props
}) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      description={description}
      className={className}
      {...props}
    />
  );
}

// ============================================
// FORM TEXTAREA
// ============================================

export function FormTextarea({
  control,
  name,
  label,
  placeholder,
  disabled = false,
  required = false,
  description,
  rows = 3,
  className,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('space-y-2', className)}>
          {label && (
            <Label 
              htmlFor={name}
              className={cn(
                'text-sm font-medium text-slate-700',
                error && 'text-red-600'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}

          <textarea
            {...field}
            {...props}
            id={name}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              // Base styles matching Input
              'flex w-full rounded-md border-2 border-slate-200 bg-white px-4 py-3 text-base',
              'placeholder:text-slate-400',
              'transition-all duration-200 ease-in-out',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'hover:border-slate-300',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
              'resize-none',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />

          {description && !error && (
            <p className="text-xs text-slate-500">{description}</p>
          )}

          {error && (
            <div 
              id={`${name}-error`}
              className="flex items-center gap-1.5 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}
        </div>
      )}
    />
  );
}

// ============================================
// FORM SELECT
// ============================================

export function FormSelect({
  control,
  name,
  label,
  placeholder = 'Chọn...',
  options = [],
  disabled = false,
  required = false,
  description,
  className,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('space-y-2', className)}>
          {label && (
            <Label 
              htmlFor={name}
              className={cn(
                'text-sm font-medium text-slate-700',
                error && 'text-red-600'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}

          <select
            {...field}
            {...props}
            id={name}
            disabled={disabled}
            className={cn(
              // Base styles matching Input
              'flex h-11 w-full rounded-md border-2 border-slate-200 bg-white px-4 py-2 text-base',
              'transition-all duration-200 ease-in-out',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              'hover:border-slate-300',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
              'appearance-none bg-no-repeat bg-right',
              // Custom dropdown arrow
              `bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")]`,
              'bg-[length:1.25rem] bg-[right_0.75rem_center]',
              'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {description && !error && (
            <p className="text-xs text-slate-500">{description}</p>
          )}

          {error && (
            <div 
              id={`${name}-error`}
              className="flex items-center gap-1.5 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}
        </div>
      )}
    />
  );
}

// ============================================
// FORM CHECKBOX
// ============================================

export function FormCheckbox({
  control,
  name,
  label,
  description,
  disabled = false,
  className,
  ...props
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
        <div className={cn('space-y-2', className)}>
          <div className="flex items-start gap-3">
            <input
              {...field}
              {...props}
              type="checkbox"
              id={name}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className={cn(
                'h-5 w-5 rounded border-2 border-slate-300',
                'text-indigo-600 focus:ring-2 focus:ring-indigo-500/20',
                'transition-colors duration-200',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500'
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${name}-error` : undefined}
            />
            
            {label && (
              <div className="flex flex-col">
                <Label 
                  htmlFor={name}
                  className={cn(
                    'text-sm font-medium text-slate-700 cursor-pointer',
                    error && 'text-red-600'
                  )}
                >
                  {label}
                </Label>
                {description && (
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div 
              id={`${name}-error`}
              className="flex items-center gap-1.5 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}
        </div>
      )}
    />
  );
}

export default FormField;

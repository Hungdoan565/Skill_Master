/**
 * useZodForm Hook
 * 
 * Custom hook để integrate React Hook Form với Zod validation
 * Cung cấp type-safe form handling với auto-validation
 * 
 * @example
 * const form = useZodForm({
 *   schema: studentSchema,
 *   defaultValues: { full_name: '', email: '' }
 * });
 * 
 * <form onSubmit={form.handleSubmit(onSubmit)}>
 *   <FormInput control={form.control} name="full_name" label="Họ tên" />
 * </form>
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Custom hook cho form với Zod validation
 * @param {Object} options - Form options
 * @param {import('zod').ZodSchema} options.schema - Zod schema for validation
 * @param {Object} options.defaultValues - Default form values
 * @param {string} options.mode - Validation mode ('onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all')
 * @returns {Object} React Hook Form methods
 */
export function useZodForm({ 
  schema, 
  defaultValues = {},
  mode = 'onBlur',
  ...formOptions 
}) {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
    ...formOptions,
  });

  return form;
}

/**
 * Utility để extract error messages từ Zod validation
 * @param {import('zod').ZodError} zodError 
 * @returns {Object} Field errors object
 */
export function extractZodErrors(zodError) {
  const errors = {};
  
  if (zodError?.errors) {
    zodError.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = err.message;
      }
    });
  }
  
  return errors;
}

/**
 * Utility để format validation errors cho display
 * @param {Object} errors - Form errors object from RHF
 * @returns {string[]} Array of error messages
 */
export function formatFormErrors(errors) {
  return Object.entries(errors).map(([field, error]) => {
    const fieldName = field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim();
    return `${fieldName}: ${error.message || error}`;
  });
}

export default useZodForm;

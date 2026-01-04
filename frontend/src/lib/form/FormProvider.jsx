/**
 * FormProvider Component
 * 
 * Wrapper component cho React Hook Form's FormProvider
 * Handles form submission với loading state và error handling
 * 
 * @example
 * <Form form={form} onSubmit={handleSubmit}>
 *   <FormInput control={form.control} name="email" />
 *   <Button type="submit">Submit</Button>
 * </Form>
 */

import * as React from 'react';
import { FormProvider as RHFFormProvider } from 'react-hook-form';
import { cn } from '@/lib/utils';

/**
 * Form wrapper với built-in form provider
 */
export function Form({
  form,
  onSubmit,
  children,
  className,
  ...props
}) {
  return (
    <RHFFormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
        noValidate
        {...props}
      >
        {children}
      </form>
    </RHFFormProvider>
  );
}

/**
 * Re-export FormProvider from react-hook-form
 */
export { FormProvider as RHFFormProvider } from 'react-hook-form';

/**
 * Custom FormProvider với context for submission state
 */
const FormContext = React.createContext({
  isSubmitting: false,
  isValid: false,
});

export function useFormContext() {
  return React.useContext(FormContext);
}

export function FormProvider({ 
  form, 
  children 
}) {
  const value = React.useMemo(() => ({
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
  }), [form.formState]);

  return (
    <FormContext.Provider value={value}>
      <RHFFormProvider {...form}>
        {children}
      </RHFFormProvider>
    </FormContext.Provider>
  );
}

export default Form;

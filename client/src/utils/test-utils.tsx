import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

type ProvidersProps = {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
};

function RHFProvider({ children, defaultValues }: ProvidersProps) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function renderWithFormProvider(
  ui: React.ReactElement,
  { defaultValues, ...options }: RenderOptions & { defaultValues?: Record<string, any> } = {}
) {
  return render(<RHFProvider defaultValues={defaultValues}>{ui}</RHFProvider>, options);
}

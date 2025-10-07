import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { FormProvider, useForm, type FieldValues, type DefaultValues } from 'react-hook-form';

type ProvidersProps<T extends FieldValues = FieldValues> = {
  children: React.ReactNode;
  defaultValues?: DefaultValues<T>;
};

function RHFProvider<T extends FieldValues = FieldValues>({ children, defaultValues }: ProvidersProps<T>) {
  const methods = useForm<T>({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function renderWithFormProvider<T extends FieldValues = FieldValues>(
  ui: React.ReactElement,
  { defaultValues, ...options }: RenderOptions & { defaultValues?: DefaultValues<T> } = {}
) {
  return render(<RHFProvider<T> defaultValues={defaultValues}>{ui}</RHFProvider>, options);
}

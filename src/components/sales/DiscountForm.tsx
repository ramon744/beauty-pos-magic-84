
import React from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

export const discountFormSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number()
    .min(0.01, 'O valor do desconto deve ser maior que zero')
    .max(100, { message: 'O percentual de desconto não pode ser maior que 100%' })
});

export type DiscountFormValues = z.infer<typeof discountFormSchema>;

interface DiscountFormProps {
  form: UseFormReturn<DiscountFormValues>;
  onSubmit: (values: DiscountFormValues) => void;
}

export const DiscountForm: React.FC<DiscountFormProps> = ({ form, onSubmit }) => {
  return (
    <Form {...form}>
      <form id="discount-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Tipo de Desconto</FormLabel>
              <div className="flex gap-4">
                <FormControl>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="percentage" 
                      value="percentage"
                      checked={field.value === 'percentage'}
                      onChange={() => field.onChange('percentage')}
                      className="mr-2" 
                    />
                    <label htmlFor="percentage">Percentual (%)</label>
                  </div>
                </FormControl>
                <FormControl>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="fixed" 
                      value="fixed"
                      checked={field.value === 'fixed'}
                      onChange={() => field.onChange('fixed')}
                      className="mr-2" 
                    />
                    <label htmlFor="fixed">Valor Fixo (R$)</label>
                  </div>
                </FormControl>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="discountValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch('discountType') === 'percentage' 
                  ? 'Percentual de Desconto (%)' 
                  : 'Valor do Desconto (R$)'}
              </FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0.01" 
                  max={form.watch('discountType') === 'percentage' ? "100" : undefined}
                  step="0.01"
                  {...field}
                  onChange={(e) => {
                    // Convert empty string to 0
                    const value = e.target.value === '' ? '0' : e.target.value;
                    field.onChange(parseFloat(value));
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

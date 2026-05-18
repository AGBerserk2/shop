import { NumberField } from '@components/common/form/NumberField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Table,
  TableRow,
  TableBody,
  TableHeader,
  TableHead,
  TableCell,
  TableFooter
} from '@components/common/ui/Table.js';
import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

export interface WeightBasedPriceProps {
  lines: Array<{
    minWeight: { value: number };
    cost: { value: number };
  }>;
}

export function WeightBasedPrice({ lines }: WeightBasedPriceProps) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'weight_based_cost'
  });

  // Initialize the field array with existing lines if it's empty
  React.useEffect(() => {
    if (fields.length === 0 && lines.length > 0) {
      lines.forEach((line) => {
        append({
          min_weight: line.minWeight?.value,
          cost: line.cost?.value
        });
      });
    }
  }, [lines, fields.length, append]);

  // Ensure there's at least one row
  React.useEffect(() => {
    if (lines.length === 0) {
      append({
        min_weight: undefined,
        cost: undefined
      });
    }
  }, [lines.length, append]);

  return (
    <div className="my-5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="border-none">Peso mínimo</TableHead>
            <TableHead className="border-none">Costo de envío</TableHead>
            <TableHead className="border-none">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={field.id} className="border-divider py-5">
              <TableCell className="border-none">
                <NumberField
                  name={`weight_based_cost.${index}.min_weight`}
                  placeholder="Peso mínimo"
                  required
                  validation={{ required: 'El peso mínimo es obligatorio' }}
                />
              </TableCell>
              <TableCell className="border-none">
                <NumberField
                  name={`weight_based_cost.${index}.cost`}
                  placeholder="Costo de envío"
                  required
                  validation={{ required: 'El costo de envío es obligatorio' }}
                />
              </TableCell>
              <TableCell className="border-none">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    Eliminar
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="border-border">
          <TableRow>
            <TableCell colSpan={3} className="border-none">
              <Button
                type="button"
                size={'sm'}
                variant={'outline'}
                onClick={() => {
                  append({
                    min_weight: undefined,
                    cost: undefined
                  });
                }}
              >
                + Agregar línea
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

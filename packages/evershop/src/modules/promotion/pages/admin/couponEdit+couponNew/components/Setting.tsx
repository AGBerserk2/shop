import { DateField } from '@components/common/form/DateField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import React from 'react';

export const Setting: React.FC<{
  discountAmount?: number;
  startDate?: string;
  endDate?: string;
}> = ({ discountAmount, startDate, endDate }) => {
  return (
    <div className="grid grid-cols-3 gap-5 form-field-container">
      <div>
        <NumberField
          name="discount_amount"
          defaultValue={discountAmount}
          placeholder="Monto del descuento"
          required
          label="Monto del descuento"
          validation={{
            required: 'El monto del descuento es obligatorio'
          }}
        />
      </div>
      <div>
        <DateField
          name="start_date"
          label="Fecha de inicio"
          placeholder="Fecha de inicio"
          defaultValue={startDate}
        />
      </div>
      <div>
        <DateField
          placeholder="Fecha de fin"
          name="end_date"
          label="Fecha de fin"
          defaultValue={endDate}
        />
      </div>
    </div>
  );
};

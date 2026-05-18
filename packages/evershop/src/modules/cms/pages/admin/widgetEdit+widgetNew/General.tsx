import { InputField } from '@components/common/form/InputField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import { Card, CardContent, CardTitle } from '@components/common/ui/Card.js';
import React from 'react';
import { useFormContext, Controller, Control } from 'react-hook-form';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const components = {
  DropdownIndicator: null
};

const createOption = (label) => ({
  label,
  value: label
});

const AreaInput: React.FC<{
  values: {
    label: string;
    value: string;
  }[];
  control: Control<any>;
}> = ({ values, control }) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (event, onChange, value) => {
    if (!inputValue) return;
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        const newOption = createOption(inputValue);
        onChange([...value, newOption]);
        setInputValue('');
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <Controller
      name="area"
      control={control}
      defaultValue={values.map((v) => v.value)}
      render={({ field }) => (
        <CreatableSelect
          components={components}
          inputValue={inputValue}
          isClearable
          isMulti
          menuIsOpen={false}
          onChange={(newValue) => {
            const stringArray = newValue
              ? newValue.map((option) => option.value)
              : [];
            field.onChange(stringArray);
          }}
          onInputChange={(newValue) => setInputValue(newValue)}
          onKeyDown={(event) =>
            handleKeyDown(
              event,
              (newOptions) => {
                const stringArray = newOptions.map((option) => option.value);
                field.onChange(stringArray);
              },
              field.value
                ? field.value.map((val) =>
                    typeof val === 'string' ? createOption(val) : val
                  )
                : []
            )
          }
          placeholder="Escribí el área y presioná Enter..."
          value={
            field.value
              ? field.value.map((val) =>
                  typeof val === 'string' ? createOption(val) : val
                )
              : []
          }
        />
      )}
    />
  );
};

interface GeneralProps {
  widget?: {
    name?: string;
    status?: number;
    sortOrder?: number;
    area?: string[];
    route?: string[];
  };
  routes: Array<{
    value: string;
    label: string;
    isApi: boolean;
    isAdmin: boolean;
    method: string[];
  }>;
}

export default function General({ widget, routes }: GeneralProps) {
  const { register, control } = useFormContext();
  const allRoutes = [
    {
      value: 'all',
      label: 'Todas',
      isAdmin: false,
      isApi: false,
      method: ['GET']
    },
    ...routes
  ];

  return (
    <Card>
      <CardContent>
        <InputField
          name="name"
          defaultValue={widget?.name}
          label="Nombre"
          required
          validation={{ required: 'El nombre es obligatorio' }}
          placeholder="Nombre"
        />
      </CardContent>
      <CardContent className="pt-3 border-t border-border">
        <RadioGroupField
          name="status"
          label="Estado"
          defaultValue={widget?.status}
          required
          validation={{ required: 'El estado es obligatorio' }}
          options={[
            { value: 0, label: 'Deshabilitado' },
            { value: 1, label: 'Habilitado' }
          ]}
        />
      </CardContent>
      <CardContent className="pt-3 border-t border-border">
        <div
          role="group"
          data-slot="field"
          data-orientation="vertical"
          className="data-[invalid=true]:text-destructive gap-3 group/field flex w-full flex-col [&amp;&gt;*]:w-full [&amp;&gt;.sr-only]:w-auto"
        >
          <label
            data-slot="field-label"
            className="text-sm font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10 gap-1 group-data-[disabled=true]/field:opacity-50 has-[&gt;[data-slot=field]]:rounded-md has-[&gt;[data-slot=field]]:border [&amp;&gt;*]:data-[slot=field]:p-3 group/field-label peer/field-label flex w-fit leading-snug has-[&gt;[data-slot=field]]:w-full has-[&gt;[data-slot=field]]:flex-col"
          >
            Áreas
          </label>
          <AreaInput
            control={control}
            values={
              widget?.area?.length
                ? widget.area.map((a) => ({ value: a, label: a }))
                : []
            }
          />
        </div>
      </CardContent>
      <CardContent className="pt-3 border-t border-border">
        <div
          role="group"
          data-slot="field"
          data-orientation="vertical"
          className="data-[invalid=true]:text-destructive gap-3 group/field flex w-full flex-col [&amp;&gt;*]:w-full [&amp;&gt;.sr-only]:w-auto"
        >
          <label
            data-slot="field-label"
            className="text-sm font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10 gap-1 group-data-[disabled=true]/field:opacity-50 has-[&gt;[data-slot=field]]:rounded-md has-[&gt;[data-slot=field]]:border [&amp;&gt;*]:data-[slot=field]:p-3 group/field-label peer/field-label flex w-fit leading-snug has-[&gt;[data-slot=field]]:w-full has-[&gt;[data-slot=field]]:flex-col"
          >
            Páginas
          </label>
          <Controller
            name="route"
            control={control}
            defaultValue={
              widget?.route
                ? widget.route // Keep as string array
                : []
            }
            render={({ field }) => (
              <Select
                options={allRoutes.filter(
                  (r) =>
                    r.isApi === false &&
                    r.isAdmin === false &&
                    r.method.includes('GET') &&
                    r.method.length === 1
                )}
                hideSelectedOptions
                isMulti
                aria-label="Seleccionar páginas"
                onChange={(selectedOptions) => {
                  const stringArray = selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : [];
                  field.onChange(stringArray);
                }}
                value={allRoutes.filter((r) => field.value?.includes(r.value))}
                className="page-select relative z-50"
              />
            )}
          />
        </div>
      </CardContent>
      <CardContent className="pt-3 border-t border-border">
        <NumberField
          name="sort_order"
          label="Orden"
          defaultValue={widget?.sortOrder}
          placeholder="Orden"
          validation={{
            required: 'El orden es obligatorio',
            min: {
              value: 0,
              message: 'El orden debe ser un número positivo'
            }
          }}
          required
          helperText="El orden en que se mostrará este widget. Los números más bajos aparecen primero."
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    widget(id: getContextValue("widgetId", null)) {
      name
      status
      sortOrder
      area
      route
    }
    routes {
      value: id
      label: name
      isApi
      isAdmin
      method
    }
  }
`;

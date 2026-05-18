import Spinner from '@components/admin/Spinner.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import { ReactSelectCreatableField } from '@components/common/form/ReactSelectCreatableField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import { UrlField } from '@components/common/form/UrlField.js';
import { Button } from '@components/common/ui/Button.js';
import { ButtonGroup } from '@components/common/ui/ButtonGroup.js';
import { Item, ItemActions, ItemContent } from '@components/common/ui/Item.js';
import { Label } from '@components/common/ui/Label.js';
import React, { useEffect } from 'react';
import { set, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useQuery } from 'urql';
import { ShippingMethod } from './Method.js';
import { PriceBasedPrice } from './PriceBasedPrice.js';
import { WeightBasedPrice } from './WeightBasedPrice.js';

const MethodsQuery = `
  query Methods {
    shippingMethods {
      value: uuid
      label: name
      updateApi
    }
    createShippingMethodApi: url(routeId: "createShippingMethod")
  }
`;

export interface ConditionProps {
  method?: ShippingMethod;
}

function Condition({ method }: ConditionProps) {
  const { watch, setValue } = useFormContext();
  const type = watch('condition_type', method?.conditionType || 'price');

  useEffect(() => {
    setValue('condition_type', method?.conditionType || 'price');
  }, [method]);

  return (
    <div className="pt-2 space-y-3">
      <Label>Condiciones</Label>
      <div>
        <RadioGroupField
          name="condition_type"
          options={[
            { value: 'price', label: 'Según el precio del pedido' },
            { value: 'weight', label: 'Según el peso del pedido' }
          ]}
          defaultValue={type}
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <NumberField
            name="min"
            label={
              type === 'price'
                ? 'Precio mínimo del pedido'
                : 'Peso mínimo del pedido'
            }
            placeholder={
              type === 'price'
                ? 'Precio mínimo del pedido'
                : 'Peso mínimo del pedido'
            }
            defaultValue={method?.min}
            required
            validation={{ required: 'El mínimo es obligatorio' }}
            helperText="Este es el precio o peso mínimo del pedido para aplicar esta condición."
          />
        </div>
        <div>
          <NumberField
            name="max"
            label={
              type === 'price'
                ? 'Precio máximo del pedido'
                : 'Peso máximo del pedido'
            }
            placeholder={
              type === 'price'
                ? 'Precio máximo del pedido'
                : 'Peso máximo del pedido'
            }
            defaultValue={method?.max}
            validation={{ required: 'El máximo es obligatorio' }}
            helperText="Este es el precio o peso máximo del pedido para aplicar esta condición."
          />
        </div>
      </div>
    </div>
  );
}

const getType = (method: ShippingMethod | null) => {
  if (method?.calculateApi) {
    return 'api';
  }
  if (method?.priceBasedCost) {
    return 'price_based_rate';
  }
  if (method?.weightBasedCost) {
    return 'weight_based_rate';
  }
  return 'flat_rate';
};

export interface MethodFormProps {
  saveMethodApi: string;
  onSuccess: () => void;
  reload: () => void;
  method?: ShippingMethod;
}

const CostSetting: React.FC<{
  method: ShippingMethod | null;
}> = ({ method }) => {
  const { watch } = useFormContext();
  const typeWatch = watch('calculation_type');
  return (
    <>
      {typeWatch === 'flat_rate' && (
        <NumberField
          label="Costo de tarifa fija"
          name="cost"
          placeholder="Costo de envío"
          required
          validation={{ required: 'El costo de envío es obligatorio' }}
          helperText="Este es el costo de tarifa fija para el envío."
          defaultValue={method?.cost?.value}
        />
      )}
      {typeWatch === 'price_based_rate' && (
        <PriceBasedPrice lines={method?.priceBasedCost || []} />
      )}
      {typeWatch === 'weight_based_rate' && (
        <WeightBasedPrice lines={method?.weightBasedCost || []} />
      )}
      {typeWatch === 'api' && (
        <InputField
          name="calculate_api"
          placeholder="Endpoint de la API de cálculo"
          required
          validation={{ required: 'La API de cálculo es obligatoria' }}
          defaultValue={method?.calculateApi || ''}
          helperText="Este es el ID de una API interna para calcular el costo de envío."
        />
      )}
    </>
  );
};

function MethodForm({
  saveMethodApi,
  onSuccess,
  reload,
  method
}: MethodFormProps) {
  const form = useForm({
    shouldUnregister: true
  });
  const [shippingMethod, setShippingMethod] = React.useState({
    ...method,
    updatingName: false
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasCondition, setHasCondition] = React.useState(
    !!method?.conditionType
  );

  const [result, reexecuteQuery] = useQuery({
    query: MethodsQuery
  });

  const handleCreate = async (inputValue) => {
    setIsLoading(true);
    const response = await fetch(result.data.createShippingMethodApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        name: inputValue
      })
    });
    const data = await response.json();
    if (response.ok) {
      await reexecuteQuery({ requestPolicy: 'network-only' });
      form.setValue('method_id', data.data.uuid);
    } else {
      toast.error(data.error.message);
    }
    setIsLoading(false);
  };

  if (result.fetching && !result.data) {
    return (
      <div className="flex justify-center p-2">
        <Spinner width={25} height={25} />
      </div>
    );
  }

  // Find the updateApi for the current method from the query results
  const methodUpdateApi = method
    ? result.data.shippingMethods.find((m) => m.value === method.uuid)
        ?.updateApi
    : null;

  return (
    <Form
      id="shippingMethodForm"
      method={method ? 'PATCH' : 'POST'}
      action={saveMethodApi}
      submitBtn={false}
      onError={(error) => {
        toast.error(error);
        setIsLoading(false);
      }}
      onSuccess={async (response) => {
        setIsLoading(false);
        if (!response.error) {
          reload();
          onSuccess && onSuccess();
          toast.success('Método de envío guardado correctamente');
        } else {
          toast.error(response.error.message);
        }
      }}
      form={form}
    >
      <div className="divide-y space-y-3">
        <div className="border-border py-3 space-y-3">
          {!method ? (
            <ReactSelectCreatableField
              name="method_id"
              label="Método de envío"
              placeholder="Selecciona o crea un método de envío"
              isClearable
              isDisabled={isLoading}
              isLoading={isLoading}
              onCreateOption={handleCreate}
              options={result.data.shippingMethods}
              required
              validation={{ required: 'El método de envío es obligatorio' }}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <InputField
                    name="method_name"
                    label="Nombre del método"
                    placeholder="Nombre del método"
                    required
                    defaultValue={method?.name || ''}
                    disabled={!shippingMethod.updatingName}
                    validation={{
                      required: 'El nombre del método es obligatorio'
                    }}
                  />
                </div>
                <Button
                  variant={shippingMethod.updatingName ? 'default' : 'outline'}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (shippingMethod.updatingName === true) {
                      if (!methodUpdateApi) {
                        toast.error('No se encontró la API de actualización');
                        return;
                      }
                      setIsLoading(true);
                      const methodName = form.getValues('method_name');
                      const response = await fetch(methodUpdateApi, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                          name: methodName
                        })
                      });
                      const data = await response.json();
                      setIsLoading(false);
                      if (response.ok) {
                        setShippingMethod({
                          ...shippingMethod,
                          name: data.data.name,
                          updatingName: false
                        });
                        toast.success(
                          'Nombre del método actualizado correctamente'
                        );
                      } else {
                        toast.error(data.error.message);
                      }
                    } else {
                      setShippingMethod({
                        ...shippingMethod,
                        updatingName: true
                      });
                    }
                  }}
                  isLoading={isLoading}
                >
                  {shippingMethod.updatingName ? 'Guardar' : 'Editar nombre'}
                </Button>
              </div>
            </div>
          )}
          <ToggleField
            name="is_enabled"
            label="Estado"
            trueLabel="Habilitar"
            falseLabel="Deshabilitar"
            defaultValue={method?.isEnabled || 0}
          />
          {method && (
            <InputField
              type="hidden"
              name="method_id"
              defaultValue={method?.uuid || ''}
            />
          )}
        </div>
        <div className="border-border py-3 space-y-3">
          <RadioGroupField
            name="calculation_type"
            label="Tipo de cálculo"
            options={[
              { label: 'Tarifa fija', value: 'flat_rate' },
              { label: 'Tarifa según el precio', value: 'price_based_rate' },
              { label: 'Tarifa según el peso', value: 'weight_based_rate' },
              { label: 'Cálculo por API', value: 'api' }
            ]}
            defaultValue={getType(method || null)}
          />

          <CostSetting method={method || null} />

          {!hasCondition && (
            <InputField
              name="condition_type"
              type="hidden"
              defaultValue="none"
            />
          )}
          {hasCondition && <Condition method={method} />}
          <Button
            variant={hasCondition ? 'destructive' : 'outline'}
            onClick={(e) => {
              e.preventDefault();
              setHasCondition(!hasCondition);
            }}
          >
            {hasCondition ? 'Quitar condición' : 'Agregar condición'}
          </Button>
        </div>
        <div className="border-border">
          <div className="flex justify-end gap-2">
            <Button
              title="Guardar"
              variant="default"
              onClick={async () => {
                const result = await form.trigger();
                if (!result) {
                  return;
                }
                setIsLoading(true);
                (
                  document.getElementById(
                    'shippingMethodForm'
                  ) as HTMLFormElement
                ).dispatchEvent(
                  new Event('submit', {
                    cancelable: true,
                    bubbles: true
                  })
                );
              }}
              isLoading={isLoading}
              disabled={shippingMethod.updatingName}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}

export { MethodForm };

import Spinner from '@components/admin/Spinner.js';
import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useQuery } from 'urql';
import { TaxRate } from './Rate.js';

const MethodsQuery = `
  query Methods {
    shippingMethods {
      value: shippingMethodId
      label: name
    }
    createShippingMethodApi: url(routeId: "createShippingMethod")
  }
`;

interface MethodFormProps {
  saveRateApi: string;
  closeModal: () => void;
  getTaxClasses: (options?: { requestPolicy?: string }) => Promise<void> | void;
  rate?: TaxRate;
}

function RateForm({
  saveRateApi,
  closeModal,
  getTaxClasses,
  rate
}: MethodFormProps) {
  const form = useForm({
    shouldUnregister: true
  });
  const [saving, setSaving] = React.useState(false);
  const [result] = useQuery({
    query: MethodsQuery
  });

  if (result.fetching) {
    return (
      <div className="flex justify-center p-2">
        <Spinner width={25} height={25} />
      </div>
    );
  }

  return (
    <Form
      form={form}
      id="taxRateForm"
      method={rate ? 'PATCH' : 'POST'}
      action={saveRateApi}
      submitBtn={false}
      onError={(error: string) => {
        toast.error(error);
        setSaving(false);
      }}
      onSuccess={async (response) => {
        if (!response.error) {
          await getTaxClasses({ requestPolicy: 'network-only' });
          closeModal();
          toast.success('¡La tasa de impuesto se guardó correctamente!');
        } else {
        }
        setSaving(false);
      }}
    >
      <div className="py-3 border-t border-border">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <InputField
              name="name"
              placeholder="Nombre"
              required
              validation={{ required: 'El nombre es obligatorio' }}
              label="Nombre"
              defaultValue={rate?.name}
            />
          </div>
          <div>
            <NumberField
              name="rate"
              label="Tasa"
              placeholder="Tasa"
              required
              validation={{ required: 'La tasa es obligatoria' }}
              defaultValue={rate?.rate}
            />
          </div>
        </div>
      </div>
      <div className="py-3 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div>
            <InputField
              name="country"
              label="País"
              placeholder="País"
              required
              validation={{ required: 'El país es obligatorio' }}
              defaultValue={rate?.country}
              helperText='Código de país (p. ej., "US"). Usa "*" para todos los países.'
            />
          </div>
          <div>
            <InputField
              name="province"
              label="Provincias"
              placeholder="Provincias"
              required
              validation={{ required: 'Las provincias son obligatorias' }}
              defaultValue={rate?.province}
              helperText='Código de provincia (p. ej., "CA"). Usa "*" para todas las provincias.'
            />
          </div>
          <div>
            <InputField
              name="postcode"
              label="Código postal"
              placeholder="Código postal"
              required
              validation={{ required: 'El código postal es obligatorio' }}
              defaultValue={rate?.postcode}
              helperText='Código postal (p. ej., "90210"). Vacío para todos los códigos postales.'
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 mt-5">
          <div>
            <ToggleField
              name="is_compound"
              label="Es compuesto"
              defaultValue={rate?.isCompound || false}
            />
          </div>
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5 mt-5">
          <div>
            <NumberField
              name="priority"
              label="Prioridad"
              placeholder="Prioridad"
              validation={{ required: 'La prioridad es obligatoria' }}
              required
              defaultValue={rate?.priority}
            />
          </div>
          <div />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button title="Cancelar" variant="secondary" onClick={closeModal}>
          Cancelar
        </Button>
        <Button
          title="Guardar"
          variant="default"
          onClick={async () => {
            const result = await form.trigger();
            if (!result) {
              return;
            }
            setSaving(true);
            (
              document.getElementById('taxRateForm') as HTMLFormElement
            ).dispatchEvent(
              new Event('submit', {
                cancelable: true,
                bubbles: true
              })
            );
          }}
          isLoading={saving}
        >
          Guardar
        </Button>
      </div>
    </Form>
  );
}

export { RateForm };

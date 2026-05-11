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
          toast.success('Tax rate has been saved successfully!');
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
              validation={{ required: 'Name is required' }}
              label="Nombre"
              defaultValue={rate?.name}
            />
          </div>
          <div>
            <NumberField
              name="rate"
              label="Rate"
              placeholder="Rate"
              required
              validation={{ required: 'Rate is required' }}
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
              validation={{ required: 'Country is required' }}
              defaultValue={rate?.country}
              helperText='Country code (e.g., "US"). Use "*" for all countries.'
            />
          </div>
          <div>
            <InputField
              name="province"
              label="Provinces"
              placeholder="Provinces"
              required
              validation={{ required: 'Provinces is required' }}
              defaultValue={rate?.province}
              helperText='Province code (e.g., "CA"). Use "*" for all provinces.'
            />
          </div>
          <div>
            <InputField
              name="postcode"
              label="Código postal"
              placeholder="Código postal"
              required
              validation={{ required: 'Postcode is required' }}
              defaultValue={rate?.postcode}
              helperText='Postcode (e.g., "90210"). Empty for all postcodes.'
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 mt-5">
          <div>
            <ToggleField
              name="is_compound"
              label="Is compound"
              defaultValue={rate?.isCompound || false}
            />
          </div>
          <div />
        </div>
        <div className="grid grid-cols-2 gap-5 mt-5">
          <div>
            <NumberField
              name="priority"
              label="Priority"
              placeholder="Priority"
              validation={{ required: 'Priority is required' }}
              required
              defaultValue={rate?.priority}
            />
          </div>
          <div />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button title="Cancelar" variant="secondary" onClick={closeModal}>
          Cancel
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
          Save
        </Button>
      </div>
    </Form>
  );
}

export { RateForm };

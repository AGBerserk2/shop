import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface TaxClassFormProps {
  saveTaxClassApi: string;
  closeModal: () => void;
  getTaxClasses: (options?: { requestPolicy?: string }) => Promise<void> | void;
}

function TaxClassForm({
  saveTaxClassApi,
  closeModal,
  getTaxClasses
}: TaxClassFormProps) {
  return (
    <Form
      id="createTaxClass"
      method="POST"
      action={saveTaxClassApi}
      submitBtn={false}
      onSuccess={async () => {
        await getTaxClasses({ requestPolicy: 'network-only' });
        closeModal();
      }}
    >
      <InputField
        name="name"
        type="text"
        label="Tax class name"
        defaultValue=""
        placeholder="Enter tax class name"
        required
        validation={{ required: 'Tax class name is required' }}
      />
      <div className="flex justify-end gap-2 mt-3">
        <Button title="Cancelar" variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
        <Button
          title="Guardar"
          variant="default"
          onClick={() => {
            (
              document.getElementById('createTaxClass') as HTMLFormElement
            ).dispatchEvent(
              new Event('submit', {
                cancelable: true,
                bubbles: true
              })
            );
          }}
        >
          Save
        </Button>
      </div>
    </Form>
  );
}

export { TaxClassForm };

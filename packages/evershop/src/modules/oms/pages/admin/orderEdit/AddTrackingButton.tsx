import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { SelectField } from '@components/common/form/SelectField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';
import { useForm } from 'react-hook-form';

interface AddTrackingButtonProps {
  order: {
    noShippingRequired: boolean;
    shipment: {
      carrier: string;
      trackingNumber: string;
      updateShipmentApi: string;
    };
    createShipmentApi: string;
  };
  carriers: {
    value: string;
    label: string;
  }[];
}
export default function AddTrackingButton({
  order: { noShippingRequired, shipment },
  carriers
}: AddTrackingButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const form = useForm();
  if (noShippingRequired || !shipment) {
    return null;
  } else {
    return (
      <>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button
              title="Edit Tracking Info"
              variant="outline"
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              Edit Tracking Info
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tracking Info</DialogTitle>
            </DialogHeader>
            <Form
              form={form}
              id="editTrackingInfo"
              method="PATCH"
              action={shipment.updateShipmentApi}
              submitBtn={false}
              onSuccess={() => {
                location.reload();
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <InputField
                    type="text"
                    name="tracking_number"
                    label="Número de seguimiento"
                    placeholder="Número de seguimiento"
                    defaultValue={shipment.trackingNumber || ''}
                    required
                    validation={{
                      required: 'Tracking number is required'
                    }}
                  />
                </div>
                <div>
                  <SelectField
                    name="carrier"
                    label="Transportista"
                    defaultValue={shipment.carrier || ''}
                    required
                    options={carriers}
                    validation={{
                      required: 'Carrier is required'
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="grid grid-cols-2 gap-2"></div>
              </div>
            </Form>
            <DialogFooter>
              <DialogClose>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                title="Guardar"
                variant="default"
                isLoading={form.formState.isSubmitting}
                onClick={async () => {
                  (
                    document.getElementById(
                      'editTrackingInfo'
                    ) as HTMLFormElement
                  ).dispatchEvent(
                    new Event('submit', { cancelable: true, bubbles: true })
                  );
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
}

export const layout = {
  areaId: 'order_actions',
  sortOrder: 5
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId")) {
      noShippingRequired
      shipment {
        shipmentId
        carrier
        trackingNumber
        updateShipmentApi
      }
      createShipmentApi
    },
    carriers {
      label: name
      value: code
    }
  }
`;

import { useAlertContext } from '@components/common/modal/Alert.js';
import RenderIfTrue from '@components/common/RenderIfTrue.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';
import { toast } from 'react-toastify';

interface ShipButtonProps {
  order: {
    noShippingRequired: boolean;
    shipment?: {
      trackingNumber?: string;
      carrier?: string;
    };
    createShipmentApi: string;
    shipmentStatus: {
      code: string;
    };
  };
}
export default function ShipButton({
  order: { noShippingRequired, shipment, createShipmentApi, shipmentStatus }
}: ShipButtonProps) {
  const { openAlert, closeAlert, dispatchAlert } = useAlertContext();
  if (noShippingRequired) {
    return (
      <Button disabled variant="secondary">
        No requiere envío
      </Button>
    );
  }
  if (shipment) {
    return null;
  }
  // Informal delivery: we don't capture carrier/tracking. Confirming
  // just flips the shipment to "shipped" and triggers the customer
  // notification email.
  const submit = async () => {
    dispatchAlert({
      type: 'update',
      payload: { secondaryAction: { isLoading: true } }
    });
    try {
      const res = await fetch(createShipmentApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.error) {
        toast.error(body?.error?.message || 'No se pudo marcar como enviado');
        dispatchAlert({
          type: 'update',
          payload: { secondaryAction: { isLoading: false } }
        });
        return;
      }
      window.location.reload();
    } catch (e) {
      toast.error('No se pudo marcar como enviado');
      dispatchAlert({
        type: 'update',
        payload: { secondaryAction: { isLoading: false } }
      });
    }
  };
  return (
    <RenderIfTrue condition={shipmentStatus.code !== 'canceled'}>
      <Button
        variant="default"
        onClick={() => {
          openAlert({
            heading: 'Marcar como enviado',
            content: (
              <div className="text-sm text-(--ui-muted-foreground)">
                Vamos a notificar al cliente que su pedido salió en camino.
              </div>
            ),
            primaryAction: {
              title: 'Cancelar',
              onAction: closeAlert,
              variant: 'outline'
            },
            secondaryAction: {
              title: 'Confirmar envío',
              onAction: submit,
              variant: 'default',
              isLoading: false
            }
          });
        }}
      >
        Marcar como enviado
      </Button>
    </RenderIfTrue>
  );
}

export const layout = {
  areaId: 'order_actions',
  sortOrder: 10
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
      shipmentStatus {
        code
      }
      createShipmentApi
    }
  }
`;

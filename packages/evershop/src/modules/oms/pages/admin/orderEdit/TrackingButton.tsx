import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface TrackingButtonProps {
  order: {
    shipment: {
      carrier: string;
      trackingNumber: string;
    };
  };
  carriers: {
    name: string;
    code: string;
    trackingUrl: string;
  }[];
}

export default function TrackingButton({
  order: { shipment },
  carriers
}: TrackingButtonProps) {
  if (!shipment || !shipment.trackingNumber || !shipment.carrier) {
    return null;
  }

  const carrier = carriers.find((c) => c.code === shipment.carrier);

  if (!carrier || !carrier.trackingUrl) {
    return null;
  }

  // Replace {trackingNumber} with the actual tracking number
  const url = carrier.trackingUrl.replace(
    /\{\s*trackingNumber\s*\}/g,
    shipment.trackingNumber
  );

  return (
    <Button
      variant="default"
      onClick={() => {
        window.open(url, '_blank')?.focus();
      }}
    >
      Rastrear envío
    </Button>
  );
}

export const layout = {
  areaId: 'order_actions',
  sortOrder: 15
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId")) {
      shipment {
        shipmentId
        carrier
        trackingNumber
        updateShipmentApi
      }
      createShipmentApi
    },
    carriers {
      name
      code
      trackingUrl
    }
  }
`;

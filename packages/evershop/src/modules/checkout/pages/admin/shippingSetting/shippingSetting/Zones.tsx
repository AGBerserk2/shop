import Spinner from '@components/admin/Spinner.jsx';
import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';
import { useQuery } from 'urql';
import { Zone } from './Zone.js';
import { ZoneForm } from './ZoneForm.js';

export interface ShippingCountry {
  label: string;
  value: string;
  provinces: Array<{
    label: string;
    value: string;
  }>;
}

const ZonesQuery = `
  query Zones {
    shippingZones {
      uuid
      name
      country {
        name
        code
      }
      provinces {
        name
        code
      }
      methods {
        methodId
        uuid
        name
        cost {
          text
          value
        }
        priceBasedCost {
          minPrice {
            value
            text
          }
          cost {
            value
            text
          }
        }
        weightBasedCost {
          minWeight {
            value
            text
          }
          cost {
            value
            text
          }
        }
        isEnabled
        conditionType
        calculateApi
        max
        min
        updateApi
        deleteApi
      }
      updateApi
      deleteApi
      addMethodApi
    }
  }
`;

export function Zones({
  createShippingZoneApi
}: {
  createShippingZoneApi: string;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: ZonesQuery,
    requestPolicy: 'network-only'
  });

  if (fetching) return <Spinner width={'2rem'} height={'2rem'} />;
  if (error)
    return (
      <div className="text-destructive">Error al cargar las zonas</div>
    );

  if (!data || !data.shippingZones)
    return <div>No se encontraron zonas</div>;
  const reload = () => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  };
  return (
    <>
      {data.shippingZones.map((zone) => (
        <Zone zone={zone} reload={reload} key={zone.uuid} />
      ))}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <div className="flex justify-end pr-5">
          <DialogTrigger>
            <Button>Crear nueva zona</Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <ZoneForm
            formMethod="POST"
            saveZoneApi={createShippingZoneApi}
            onSuccess={() => {
              setDialogOpen(false);
            }}
            reload={reload}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useAlertContext } from '@components/common/modal/Alert.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';
import { toast } from 'react-toastify';

interface Delivery {
  status: string;
  driverName: string;
  driverPhone?: string | null;
  driverUrl: string;
}

interface AssignDriverButtonProps {
  order: {
    uuid: string;
    delivery: Delivery | null;
  };
  assignDriverApi: string;
}

const STATUS_LABEL: Record<string, string> = {
  assigned: 'Repartidor asignado',
  en_route: 'En camino',
  delivered: 'Entregado'
};

export default function AssignDriverButton({
  order,
  assignDriverApi
}: AssignDriverButtonProps) {
  const { openAlert, closeAlert, dispatchAlert } = useAlertContext();

  // A driver is already assigned — show the info and the shareable link.
  if (order.delivery) {
    const { status, driverName, driverPhone, driverUrl } = order.delivery;
    const waText = encodeURIComponent(
      `Hola ${driverName}, este es el enlace para la entrega: ${driverUrl}`
    );
    const phone = (driverPhone || '').replace(/\D/g, '');
    const waUrl = phone
      ? `https://wa.me/${phone.startsWith('1') ? phone : `1${phone}`}?text=${waText}`
      : `https://wa.me/?text=${waText}`;
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
        <div className="text-sm font-semibold">Repartidor: {driverName}</div>
        <div className="text-xs text-muted-foreground">
          {STATUS_LABEL[status] || status}
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={driverUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-md border border-border bg-muted px-2 py-1 text-xs"
          />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard
                ?.writeText(driverUrl)
                .then(() => toast.success('Enlace copiado'))
                .catch(() => toast.error('No se pudo copiar'));
            }}
          >
            Copiar
          </Button>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-accent underline"
        >
          Enviar al repartidor por WhatsApp
        </a>
      </div>
    );
  }

  const submit = async () => {
    const nameInput = document.getElementById(
      'assign-driver-name'
    ) as HTMLInputElement | null;
    const phoneInput = document.getElementById(
      'assign-driver-phone'
    ) as HTMLInputElement | null;
    const driverName = (nameInput?.value || '').trim();
    const driverPhone = (phoneInput?.value || '').trim();
    if (!driverName) {
      toast.error('Escribí el nombre del repartidor');
      return;
    }
    dispatchAlert({
      type: 'update',
      payload: { secondaryAction: { isLoading: true } }
    });
    try {
      const res = await fetch(assignDriverApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.uuid,
          driver_name: driverName,
          driver_phone: driverPhone
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.error) {
        toast.error(
          body?.error?.message || 'No se pudo asignar el repartidor'
        );
        dispatchAlert({
          type: 'update',
          payload: { secondaryAction: { isLoading: false } }
        });
        return;
      }
      // Reload so the order re-queries and shows the driver link panel.
      window.location.reload();
    } catch (e) {
      toast.error('No se pudo asignar el repartidor');
      dispatchAlert({
        type: 'update',
        payload: { secondaryAction: { isLoading: false } }
      });
    }
  };

  return (
    <Button
      variant="default"
      onClick={() => {
        openAlert({
          heading: 'Asignar repartidor',
          content: (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Generá un enlace de seguimiento para mandarle al repartidor.
              </p>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="assign-driver-name"
                  className="text-xs font-semibold"
                >
                  Nombre del repartidor
                </label>
                <input
                  id="assign-driver-name"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="assign-driver-phone"
                  className="text-xs font-semibold"
                >
                  Teléfono (opcional)
                </label>
                <input
                  id="assign-driver-phone"
                  type="tel"
                  placeholder="Ej. 809-555-1234"
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
            </div>
          ),
          primaryAction: {
            title: 'Cancelar',
            onAction: closeAlert,
            variant: 'outline'
          },
          secondaryAction: {
            title: 'Generar enlace',
            onAction: submit,
            variant: 'default',
            isLoading: false
          }
        });
      }}
    >
      Asignar repartidor
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
      uuid
      delivery {
        status
        driverName
        driverPhone
        driverUrl
      }
    }
    assignDriverApi: url(routeId: "assignDriver")
  }
`;

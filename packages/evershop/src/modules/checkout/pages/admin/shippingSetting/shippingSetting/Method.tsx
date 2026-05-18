import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@components/common/ui/Dialog.js';
import { Cog } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';
import { MethodForm } from './MethodForm.js';

export interface ShippingMethod {
  methodId: string;
  uuid: string;
  name: string;
  isEnabled: boolean;
  cost?: {
    text: string;
    value: number;
  };
  priceBasedCost?: Array<{
    minPrice: { value: number; text: string };
    cost: { value: number; text: string };
  }>;
  weightBasedCost?: Array<{
    minWeight: { value: number; text: string };
    cost: { value: number; text: string };
  }>;
  calculateApi?: string;
  conditionType?: string;
  min?: number;
  max?: number;
  updateApi: string;
  deleteApi: string;
}
export interface MethodProps {
  method: ShippingMethod;
  reload: () => void;
}

function Method({ method, reload }: MethodProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <>
        <td className="border-none py-2">{method.name}</td>
        <td className="border-none py-2">
          {method.isEnabled ? (
            <span className="text-green-700">Habilitado</span>
          ) : (
            <span className="text-destructive">Deshabilitado</span>
          )}
        </td>
        <td className="border-none py-2">
          {method.cost?.text || (
            <a
              href="#"
              className="text-primary"
              onClick={(e) => {
                e.preventDefault();
                setDialogOpen(true);
              }}
            >
              <Cog width={22} height={22} />
            </a>
          )}
        </td>
        <td className="border-none py-2">
          {method.conditionType
            ? `${method.min || 0} <= ${method.conditionType} <= ${
                method.max || '∞'
              }`
            : 'Ninguno'}
        </td>
        <td className="border-none py-2">
          <a
            href="#"
            className="text-primary"
            onClick={(e) => {
              e.preventDefault();
              setDialogOpen(true);
            }}
          >
            Editar
          </a>
          <a
            href="#"
            className="text-destructive ml-5"
            onClick={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(method.deleteApi, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include'
                });
                if (response.ok) {
                  reload();
                  // Toast success
                  toast.success('Método eliminado correctamente');
                } else {
                  // Toast error
                  toast.error('No se pudo eliminar el método');
                }
              } catch (error) {
                // Toast error
                toast.error('No se pudo eliminar el método');
              }
            }}
          >
            Eliminar
          </a>
        </td>
      </>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar método de envío</DialogTitle>
        </DialogHeader>
        <MethodForm
          saveMethodApi={method.updateApi}
          onSuccess={() => setDialogOpen(false)}
          reload={reload}
          method={method}
        />
      </DialogContent>
    </Dialog>
  );
}

export { Method };

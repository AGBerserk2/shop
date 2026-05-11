import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@components/common/ui/Table.js';
import React from 'react';
import { Method, ShippingMethod } from './Method.js';
import { MethodForm } from './MethodForm.js';

export interface MethodsProps {
  methods: Array<ShippingMethod>;
  reload: () => void;
  addMethodApi: string;
}

export function Methods({ reload, methods, addMethodApi }: MethodsProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <div className="my-5 text-xs">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="border-none">Método</TableHead>
            <TableHead className="border-none">Estado</TableHead>
            <TableHead className="border-none">Costo</TableHead>
            <TableHead className="border-none">Condition</TableHead>
            <TableHead className="border-none">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.map((method) => (
            <TableRow
              key={method.methodId}
              className="border-divider py-5 text-xs"
            >
              <Method method={method} reload={reload} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <div className="mt-2">
          <DialogTrigger>
            <Button
              variant={'link'}
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              + Add Method
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <DialogTitle>Add Shipping Method</DialogTitle>
          <MethodForm
            saveMethodApi={addMethodApi}
            onSuccess={() => {
              setDialogOpen(false);
            }}
            reload={reload}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Rate, TaxRate } from './Rate.js';
import { RateForm } from './RateForm.js';

interface RatesProps {
  getTaxClasses: (options?: { requestPolicy?: string }) => Promise<void> | void;
  rates: Array<TaxRate>;
  addRateApi: string;
}
export function Rates({ getTaxClasses, rates, addRateApi }: RatesProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="border-none">Nombre</TableHead>
            <TableHead className="border-none">País</TableHead>
            <TableHead className="border-none">Rate</TableHead>
            <TableHead className="border-none">Compound</TableHead>
            <TableHead className="border-none">Priority</TableHead>
            <TableHead className="border-none">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((rate) => (
            <TableRow key={rate.uuid} className="border-divider py-5">
              <Rate rate={rate} getTaxClasses={getTaxClasses} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button
              variant="link"
              onClick={(e) => {
                e.preventDefault();
                setDialogOpen(true);
              }}
            >
              + Add Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tax Rate</DialogTitle>
            </DialogHeader>
            <RateForm
              saveRateApi={addRateApi}
              closeModal={() => setDialogOpen(false)}
              getTaxClasses={getTaxClasses}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';
import { VariantGroup } from '../VariantGroup.js';
import { VariantModal } from './VariantModal.js';

export const CreateVariant: React.FC<{
  variantGroup: VariantGroup;
  createProductApi: string;
  refresh: () => void;
}> = ({ variantGroup, createProductApi, refresh }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="mt-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger>
          <Button variant={'outline'}>Agregar variante</Button>
        </DialogTrigger>
        <DialogContent className={'sm:max-w-212.5'}>
          <DialogHeader>
            <DialogTitle>Nueva variante</DialogTitle>
            <DialogDescription>
              Creá una nueva variante para este producto.
            </DialogDescription>
          </DialogHeader>
          <VariantModal
            refresh={refresh}
            closeDialog={() => setDialogOpen(false)}
            variantGroup={variantGroup}
            createProductApi={createProductApi}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

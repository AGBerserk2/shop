import { ProductSelector } from '@components/admin/ProductSelector.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';

export const SkuConditionValueSelector: React.FC<{
  selectedValues: Array<string> | string;
  updateCondition: (values: string | Array<string>) => void;
  isMulti: boolean;
}> = ({ selectedValues, updateCondition, isMulti }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const skus = Array.isArray(selectedValues) ? selectedValues : [];
  const selectedSKUs = React.useRef(skus || []);

  const onSelect = (sku) => {
    if (!isMulti) {
      selectedSKUs.current = [sku];
      setDialogOpen(false);
    } else {
      selectedSKUs.current = [...selectedSKUs.current, sku];
    }
  };

  const onUnSelect = (sku) => {
    const prev = selectedSKUs.current;
    selectedSKUs.current = prev.filter((s) => s !== sku);
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => setDialogOpen(open)}
      onOpenChangeComplete={(open) => {
        if (!open) {
          updateCondition(selectedSKUs.current);
        }
      }}
    >
      <DialogTrigger>
        <Button variant={'link'}>
          {selectedSKUs.current.map((sku, index) => (
            <span key={sku}>
              {index === 0 && (
                <span className="italic">&lsquo;{sku}&rsquo;</span>
              )}
              {index === 1 && (
                <span> y {selectedSKUs.current.length - 1} más</span>
              )}
            </span>
          ))}
          {selectedSKUs.current.length === 0 && <span>Elegir SKUs</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className={'max-w-[80vw]'}>
        <DialogHeader>
          <DialogTitle>Seleccionar productos por SKU</DialogTitle>
        </DialogHeader>
        <ProductSelector
          onSelect={onSelect}
          onUnSelect={onUnSelect}
          selectedProducts={selectedSKUs.current.map((sku) => ({
            sku,
            uuid: undefined,
            productId: undefined
          }))}
        />
      </DialogContent>
    </Dialog>
  );
};

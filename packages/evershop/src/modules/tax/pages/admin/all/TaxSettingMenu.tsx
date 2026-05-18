import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { cn } from '@evershop/evershop/lib/util/cn';
import { Settings } from 'lucide-react';
import React from 'react';

interface TaxSettingMenuProps {
  taxSettingUrl: string;
}

export default function TaxSettingMenu({ taxSettingUrl }: TaxSettingMenuProps) {
  const isActive =
    typeof window !== 'undefined' &&
    new URL(taxSettingUrl, window.location.origin).pathname ===
      window.location.pathname;

  return (
    <Item
      variant={'outline'}
      className={cn(
        isActive && 'bg-primary/5 border-primary/20 dark:bg-primary/10'
      )}
      data-active={isActive ? 'true' : 'false'}
    >
      <ItemContent>
        <ItemTitle>
          <div>
            <a
              href={taxSettingUrl}
              className={cn(
                'uppercase text-xs font-semibold',
                isActive && 'text-primary'
              )}
            >
              Configuración de impuestos
            </a>
          </div>
        </ItemTitle>
        <ItemDescription>
          <div>Configura las clases de impuesto y las tasas de impuesto</div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = taxSettingUrl)}
        >
          <Settings className="h-4 w-4 mr-1" />
        </Button>
      </ItemActions>
    </Item>
  );
}

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 20
};

export const query = `
  query Query {
    taxSettingUrl: url(routeId: "taxSetting")
  }
`;

import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import React from 'react';

interface WidgetType {
  code: string;
  name: string;
  description: string;
  createWidgetUrl: string;
}

const WidgetTypes: React.FC<{
  types: Array<WidgetType>;
}> = ({ types }) => {
  return (
    <div className="space-y-2">
      {types.map((type, index) => (
        <Item key={index} variant="outline">
          <ItemContent>
            <ItemTitle> {type.name}</ItemTitle>
            <ItemDescription>{type.description}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                window.location.href = type.createWidgetUrl;
              }}
            >
              Elegir
            </Button>
          </ItemActions>
        </Item>
      ))}
    </div>
  );
};

interface NewWidgetButtonProps {
  widgetTypes: Array<WidgetType>;
}

export default function NewWidgetButton({ widgetTypes }: NewWidgetButtonProps) {
  return (
    <Dialog>
      <DialogTrigger>
        <Button>Nuevo widget</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo widget</DialogTitle>
        </DialogHeader>
        <WidgetTypes types={widgetTypes} />
      </DialogContent>
    </Dialog>
  );
}

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 10
};

export const query = `
  query Query {
    widgetTypes {
      code
      name
      description
      createWidgetUrl
    }
  }
`;

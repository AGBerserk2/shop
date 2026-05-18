import { Button } from '@components/common/ui/Button.js';
import { Card, CardContent } from '@components/common/ui/Card.js';
import React from 'react';
import { CreateVariantGroup } from './CreateVariantGroup.js';

export const New: React.FC<{
  currentProductUuid: string;
  createVariantGroupApi: string;
  setGroup: (group: any) => void;
}> = ({ currentProductUuid, createVariantGroupApi, setGroup }) => {
  const [action, setAction] = React.useState<'create' | undefined>();
  return (
    <>
      <CardContent>
        {action === undefined && (
          <div>
            <div className="justify-left text-left">
              <div className="space-y-2">
                <div>
                  ¿Este producto tiene variantes como color o tamaño?
                </div>
                <Button
                  variant={'secondary'}
                  onClick={(e) => {
                    e.preventDefault();
                    setAction('create');
                  }}
                >
                  Crear un grupo de variantes
                </Button>
              </div>
            </div>
          </div>
        )}
        {action === 'create' && (
          <div>
            <CreateVariantGroup
              currentProductUuid={currentProductUuid}
              setGroup={setGroup}
              onCancel={() => setAction(undefined)}
              createVariantGroupApi={createVariantGroupApi}
            />
          </div>
        )}
      </CardContent>
    </>
  );
};

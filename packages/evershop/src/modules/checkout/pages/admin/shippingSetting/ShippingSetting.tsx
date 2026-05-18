import { SettingMenu } from '@components/admin/SettingMenu.js';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';
import { Zones } from './shippingSetting/Zones.js';

export default function ShippingSetting({
  createShippingZoneApi
}: {
  createShippingZoneApi: string;
}) {
  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Envío</CardTitle>
              <CardDescription>
                Elige dónde envías y cuánto cobras por el envío.
              </CardDescription>
            </CardHeader>
            <Zones createShippingZoneApi={createShippingZoneApi} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    createShippingZoneApi: url(routeId: "createShippingZone")
  }
`;

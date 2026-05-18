import { FormButtons } from '@components/admin/FormButtons.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface CouponEditFormProps {
  action: string;
  gridUrl: string;
}
export default function CouponEditForm({
  action,
  gridUrl
}: CouponEditFormProps) {
  return (
    <Form method="PATCH" action={action} submitBtn={false} id="couponEditForm">
      <div className="grid grid-cols-1 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
            <CardDescription>
              La información general del cupón.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Area id="couponEditGeneral" noOuter />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tipo de descuento</CardTitle>
            <CardDescription>
              El tipo de descuento que aplica el cupón.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Area id="couponEditDiscountType" noOuter />
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-x-5 grid-flow-row ">
          <div className="col-span-2 grid grid-cols-1 gap-5 auto-rows-max">
            <Card>
              <CardHeader>
                <CardTitle>Condiciones del pedido</CardTitle>
                <CardDescription>
                  Las condiciones relacionadas con el pedido para que se
                  aplique el cupón.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Area id="couponEditLeft" noOuter className="col-8" />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1 grid grid-cols-1 gap-5 auto-rows-max">
            <Card>
              <CardHeader>
                <CardTitle>Condiciones del cliente</CardTitle>
                <CardDescription>
                  Las condiciones relacionadas con el cliente para que se
                  aplique el cupón.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Area id="couponEditRight" className="col-4" noOuter />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <FormButtons cancelUrl={gridUrl} formId="couponEditForm" />
    </Form>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    action: url(routeId: "updateCoupon", params: [{key: "id", value: getContextValue("couponUuid")}]),
    gridUrl: url(routeId: "couponGrid")
  }
`;

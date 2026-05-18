import { InputField } from '@components/common/form/InputField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import { ToggleField } from '@components/common/form/ToggleField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface PaypalPaymentProps {
  setting: {
    paypalPaymentStatus: true | false | 0 | 1;
    paypalDisplayName: string;
    paypalClientId: string;
    paypalClientSecret: string;
    paypalEnvironment: string;
    paypalPaymentIntent: string;
  };
}
export default function PaypalPayment({
  setting: {
    paypalPaymentStatus,
    paypalDisplayName,
    paypalClientId,
    paypalClientSecret,
    paypalEnvironment,
    paypalPaymentIntent
  }
}: PaypalPaymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago con PayPal</CardTitle>
        <CardDescription>
          Configurá los ajustes de la pasarela de pago de PayPal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>¿Habilitar?</h4>
          </div>
          <div className="col-span-2">
            <ToggleField
              name="paypalPaymentStatus"
              defaultValue={paypalPaymentStatus}
              trueValue={1}
              falseValue={0}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Nombre visible</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="paypalDisplayName"
              placeholder="Nombre visible"
              defaultValue={paypalDisplayName}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>ID de cliente</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="paypalClientId"
              placeholder="ID de cliente"
              defaultValue={paypalClientId}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clave secreta del cliente</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="paypalClientSecret"
              placeholder="Clave secreta"
              defaultValue={paypalClientSecret}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Entorno</h4>
          </div>
          <div className="col-span-2">
            <RadioGroupField
              name="paypalEnvironment"
              defaultValue={paypalEnvironment}
              options={[
                {
                  label: 'Pruebas (Sandbox)',
                  value: 'https://api-m.sandbox.paypal.com'
                },
                {
                  label: 'Producción',
                  value: 'https://api-m.paypal.com'
                }
              ]}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Modo de pago</h4>
          </div>
          <div className="col-span-2">
            <RadioGroupField
              name="paypalPaymentIntent"
              defaultValue={paypalPaymentIntent}
              options={[
                { label: 'Solo autorizar', value: 'AUTHORIZE' },
                { label: 'Capturar', value: 'CAPTURE' }
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 15
};

export const query = `
  query Query {
    setting {
      paypalPaymentStatus
      paypalDisplayName
      paypalClientId
      paypalClientSecret
      paypalEnvironment
      paypalPaymentIntent
    }
  }
`;

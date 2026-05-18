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

interface StripePaymentProps {
  setting: {
    stripePaymentStatus: true | false | 0 | 1;
    stripeDisplayName: string;
    stripePublishableKey: string;
    stripeSecretKey: string;
    stripeEndpointSecret: string;
    stripePaymentMode: string;
  };
}
export default function StripePayment({
  setting: {
    stripePaymentStatus,
    stripeDisplayName,
    stripePublishableKey,
    stripeSecretKey,
    stripeEndpointSecret,
    stripePaymentMode
  }
}: StripePaymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago con Stripe</CardTitle>
        <CardDescription>
          Configurá los ajustes de la pasarela de pago de Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>¿Habilitar?</h4>
          </div>
          <div className="col-span-2">
            <ToggleField
              name="stripePaymentStatus"
              defaultValue={stripePaymentStatus}
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
              name="stripeDisplayName"
              placeholder="Nombre visible"
              defaultValue={stripeDisplayName || ''}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clave pública</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="stripePublishableKey"
              placeholder="Clave pública"
              defaultValue={stripePublishableKey || ''}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clave secreta</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="stripeSecretKey"
              placeholder="Clave secreta"
              defaultValue={stripeSecretKey || ''}
            />
          </div>
        </div>
      </CardContent>
      <CardContent className="pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 items-center flex">
            <h4>Clave secreta del webhook</h4>
          </div>
          <div className="col-span-2">
            <InputField
              name="stripeEndpointSecret"
              placeholder="Clave secreta"
              defaultValue={stripeEndpointSecret || ''}
              helperText="La URL de tu webhook debe ser: https://tudominio.com/api/stripe/webhook"
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
              name="stripePaymentMode"
              defaultValue={stripePaymentMode}
              options={[
                { label: 'Solo autorizar', value: 'authorizeOnly' },
                { label: 'Capturar', value: 'capture' }
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
  sortOrder: 10
};

export const query = `
  query Query {
    setting {
      stripeDisplayName
      stripePaymentStatus
      stripePublishableKey
      stripeSecretKey
      stripeEndpointSecret
      stripePaymentMode
    }
  }
`;

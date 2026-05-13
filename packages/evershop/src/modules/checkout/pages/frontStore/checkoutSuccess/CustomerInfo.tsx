import { AddressSummary } from '@components/common/customer/address/AddressSummary.js';
import {
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  Receipt,
  Sparkles,
  Truck,
  User
} from 'lucide-react';
import React from 'react';

interface CustomerInfoProps {
  order: {
    orderNumber: string;
    customerFullName: string;
    customerEmail: string;
    paymentMethodName: string;
    noShippingRequired: boolean;
    shippingAddress: {
      fullName: string;
      postcode: string;
      telephone: string;
      country: { name: string; code: string };
      province: { name: string; code: string };
      city: string;
      address1: string;
      address2: string;
    };
    billingAddress: {
      fullName: string;
      postcode: string;
      telephone: string;
      country: { name: string; code: string };
      province: { name: string; code: string };
      city: string;
      address1: string;
      address2: string;
    };
  };
}

export default function CustomerInfo({
  order: {
    orderNumber,
    customerFullName,
    customerEmail,
    paymentMethodName,
    noShippingRequired,
    shippingAddress,
    billingAddress
  }
}: CustomerInfoProps) {
  const name = (customerFullName || billingAddress?.fullName || '').trim();
  const firstName = name.split(' ')[0];

  return (
    <div className="anroy-thanks__main">
      {/* Hero */}
      <section className="anroy-thanks__hero">
        <span className="anroy-thanks__check" aria-hidden>
          <Check />
        </span>
        <span className="anroy-thanks__eyebrow">
          <Sparkles className="w-3 h-3" strokeWidth={2.2} />
          Pedido confirmado
        </span>
        <h1 className="anroy-thanks__title">
          ¡Gracias
          {firstName ? (
            <>
              ,&nbsp;<span className="italic">{firstName}</span>
            </>
          ) : null}
          !
        </h1>
        <p className="anroy-thanks__lede">
          Tu pedido <b>está confirmado</b>. Te enviamos un correo a{' '}
          <b>{customerEmail}</b> con todos los detalles. Lo preparamos a
          mano y te avisamos apenas salga en camino.
        </p>
        <span className="anroy-thanks__order-num">
          <small>Pedido</small> #{orderNumber}
        </span>
      </section>

      {/* Details grid */}
      <section className="anroy-thanks__details">
        <h2 className="anroy-thanks__details-title">Detalles del pedido</h2>
        <div className="anroy-thanks__details-grid">
          <div className="anroy-thanks__cell">
            <span className="anroy-thanks__cell-head">
              <User /> Contacto
            </span>
            <div className="anroy-thanks__cell-body">
              <div>{customerFullName || billingAddress?.fullName}</div>
              <div className="muted">{customerEmail}</div>
            </div>
          </div>

          <div className="anroy-thanks__cell">
            <span className="anroy-thanks__cell-head">
              <Truck /> Envío
            </span>
            <div className="anroy-thanks__cell-body">
              {noShippingRequired ? (
                <span className="muted">No requiere envío</span>
              ) : (
                <AddressSummary address={shippingAddress} />
              )}
            </div>
          </div>

          <div className="anroy-thanks__cell">
            <span className="anroy-thanks__cell-head">
              <CreditCard /> Método de pago
            </span>
            <div className="anroy-thanks__cell-body">{paymentMethodName}</div>
          </div>

          <div className="anroy-thanks__cell">
            <span className="anroy-thanks__cell-head">
              <MapPin /> Facturación
            </span>
            <div className="anroy-thanks__cell-body">
              <AddressSummary address={billingAddress} />
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <div className="anroy-thanks__cta-row">
        <a
          href="/account/orders"
          className="anroy-thanks__cta anroy-thanks__cta--primary"
        >
          <Receipt className="w-4 h-4" strokeWidth={2.2} />
          Ver mis pedidos
        </a>
        <a
          href="/"
          className="anroy-thanks__cta anroy-thanks__cta--ghost"
        >
          Seguir comprando
          <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
        </a>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'checkoutSuccessPageLeft',
  sortOrder: 10
};

export const query = `
  query Query {
    order (uuid: getContextValue('orderId')) {
      orderNumber
      customerFullName
      customerEmail
      paymentMethodName
      noShippingRequired
      shippingNote
      shippingAddress {
        fullName
        postcode
        telephone
        country {
          name
          code
        }
        province {
          name
          code
        }
        city
        address1
        address2
      }
      billingAddress {
        fullName
        postcode
        telephone
        country {
          name
          code
        }
        province {
          name
          code
        }
        city
        address1
        address2
      }
    }
  }
`;

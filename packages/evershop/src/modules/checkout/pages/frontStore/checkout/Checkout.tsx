import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { CartItems } from '@components/frontStore/cart/CartItems.js';
import { CartSummaryItemsList } from '@components/frontStore/cart/CartSummaryItems.js';
import { CartTotalSummary } from '@components/frontStore/cart/CartTotalSummary.js';
import { CheckoutButton } from '@components/frontStore/checkout/CheckoutButton.js';
import { CheckoutProvider } from '@components/frontStore/checkout/CheckoutContext.js';
import { ContactInformation } from '@components/frontStore/checkout/ContactInformation.js';
import { Payment } from '@components/frontStore/checkout/Payment.js';
import { Shipment } from '@components/frontStore/checkout/Shipment.js';
import { ChevronLeft, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import './Checkout.scss';

interface CheckoutPageProps {
  placeOrderApi: string;
  getPaymentMethodApi: string;
  getShippingMethodApi: string;
  checkoutSuccessUrl: string;
}

const Step: React.FC<{ num: number; label: string; active?: boolean }> = ({
  num,
  label,
  active
}) => (
  <span
    className="anroy-checkout__step"
    data-active={active ? 'true' : 'false'}
  >
    <span className="anroy-checkout__step-num">{num}</span>
    <span className="anroy-checkout__step-label">{label}</span>
  </span>
);

export default function CheckoutPage({
  placeOrderApi,
  checkoutSuccessUrl
}: CheckoutPageProps) {
  const [disabled, setDisabled] = React.useState(false);
  const form = useForm({
    disabled: disabled,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {}
  });

  return (
    <CheckoutProvider
      form={form}
      enableForm={() => setDisabled(false)}
      disableForm={() => setDisabled(true)}
      allowGuestCheckout={true}
      placeOrderApi={placeOrderApi}
      checkoutSuccessUrl={checkoutSuccessUrl}
    >
      <div className="anroy-checkout">
        <div className="anroy-checkout__wrap">
          {/* ── Masthead ────────────────────────────────────── */}
          <div className="anroy-checkout__head">
            <a
              href="/cart"
              className="anroy-checkout__back"
              onClick={(e) => {
                if (
                  typeof window !== 'undefined' &&
                  window.history.length > 1
                ) {
                  e.preventDefault();
                  window.history.back();
                }
              }}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
              Volver al carrito
            </a>

            <div className="anroy-checkout__title-wrap">
              <span className="anroy-checkout__eyebrow">Última parada</span>
              <h1 className="anroy-checkout__title">Confirmá tu pedido</h1>
            </div>

            <span className="anroy-checkout__secure">
              <ShieldCheck className="w-4 h-4" strokeWidth={2} />
              Pago seguro
            </span>
          </div>

          {/* ── Step indicator ──────────────────────────────── */}
          <div
            className="anroy-checkout__steps"
            aria-label="Pasos del checkout"
          >
            <Step num={1} label="Contacto" active />
            <span className="anroy-checkout__step-divider" />
            <Step num={2} label="Envío" active />
            <span className="anroy-checkout__step-divider" />
            <Step num={3} label="Pago" active />
          </div>

          {/* ── Two-column body ─────────────────────────────── */}
          <div className="anroy-checkout__grid">
            <div className="anroy-checkout__form">
              <Form form={form} submitBtn={false}>
                <Area id="checkoutFormBefore" noOuter />
                <div>
                  <ContactInformation />
                  <Shipment />
                  <Payment />
                  <CheckoutButton />
                </div>
                <Area id="checkoutForm" noOuter />
                <Area id="checkoutFormAfter" noOuter />
              </Form>
            </div>

            {/* ── Order summary sidebar ─────────────────────── */}
            <aside className="anroy-checkout__sidebar">
              <div className="anroy-checkout__summary">
                <CartItems>
                  {({ items, loading, showPriceIncludingTax }) => (
                    <>
                      <h2 className="anroy-checkout__summary-title">
                        Tu pedido
                        <span className="anroy-checkout__summary-count">
                          {items.length} pieza
                          {items.length === 1 ? '' : 's'}
                        </span>
                      </h2>
                      <CartSummaryItemsList
                        items={items}
                        loading={loading}
                        showPriceIncludingTax={showPriceIncludingTax}
                      />
                    </>
                  )}
                </CartItems>
                <CartTotalSummary />

                <div className="anroy-checkout__assurance">
                  <div className="anroy-checkout__assurance-item">
                    <Truck className="w-4 h-4" strokeWidth={2} />
                    Envío a toda República Dominicana
                  </div>
                  <div className="anroy-checkout__assurance-item">
                    <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                    Pago protegido y reembolso garantizado
                  </div>
                  <div className="anroy-checkout__assurance-item">
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                    Esmaltes hechos a mano en RD
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </CheckoutProvider>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    placeOrderApi: url(routeId: "createOrder")
    checkoutSuccessUrl: url(routeId: "checkoutSuccess")
  }
`;

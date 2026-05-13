import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Coupon,
  CouponActions,
  CouponState
} from '@components/frontStore/Coupon.js';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

export function CouponForm() {
  const form = useForm<{ coupon: string }>();
  const coupon = form.watch('coupon');
  return (
    <Coupon
      onApplySuccess={() => {
        toast.success('¡Cupón aplicado!');
      }}
      onError={() => {
        toast.error('Cupón inválido');
      }}
      onRemoveSuccess={() => {
        toast.success('Cupón eliminado');
      }}
    >
      {(state: CouponState, actions: CouponActions) => (
        <div className="coupon-form">
          <Form form={form} method="POST" submitBtn={false}>
            <div className="flex justify-between gap-3">
              <div className="w-4/5">
                <InputField
                  name="coupon"
                  required
                  validation={{
                    required: {
                      value: true,
                      message: 'El código del cupón es obligatorio'
                    }
                  }}
                  defaultValue={state.appliedCoupon || ''}
                  disabled={!!state.appliedCoupon}
                  placeholder="Ingresá tu código"
                  wrapperClassName="mb-0 form-field"
                />
              </div>
              <div className="col-span-1">
                <Button
                  isLoading={state.isLoading}
                  onClick={async () => {
                    if (state.appliedCoupon) {
                      await actions.removeCoupon();
                    } else {
                      const isValid = await form.trigger();
                      if (isValid) {
                        actions.applyCoupon(coupon);
                      }
                    }
                  }}
                  variant={state.appliedCoupon ? 'destructive' : 'default'}
                >
                  {state.appliedCoupon ? 'Quitar' : 'Aplicar'}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </Coupon>
  );
}

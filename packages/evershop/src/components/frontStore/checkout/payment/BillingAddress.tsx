import { Button } from '@components/common/ui/Button.js';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@components/common/ui/Item.js';
import { Label } from '@components/common/ui/Label.js';
import {
  RadioGroup,
  RadioGroupItem
} from '@components/common/ui/RadioGroup.js';
import {
  useCheckout,
  useCheckoutDispatch
} from '@components/frontStore/checkout/CheckoutContext.js';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import {
  Address,
  CustomerAddressGraphql
} from '@evershop/evershop/types/customerAddress';
import React, { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

export function BillingAddress({
  billingAddress,
  addBillingAddress,
  addingBillingAddress,
  noShippingRequired
}: {
  billingAddress?: CustomerAddressGraphql;
  addBillingAddress?: (address: Address) => Promise<void>;
  addingBillingAddress?: boolean;
  noShippingRequired: boolean;
}) {
  const { form, checkoutData } = useCheckout();
  const { updateCheckoutData } = useCheckoutDispatch();
  const {
    setValue,
    getValues,
    trigger,
    formState: { disabled }
  } = form;

  const shippingAddress = useWatch({
    control: form.control,
    name: 'shippingAddress'
  });

  const billingAddressField = useWatch({
    control: form.control,
    name: 'billingAddress'
  });

  const [useSameAddress, setUseSameAddress] = useState(!noShippingRequired);

  useEffect(() => {
    if (useSameAddress && shippingAddress) {
      updateCheckoutData({ billingAddress: shippingAddress });
    } else if (!useSameAddress) {
      setValue('billingAddress', billingAddress);
    }
  }, [useSameAddress, checkoutData.shippingAddress]);

  useEffect(() => {
    if (!useSameAddress) {
      const billingAddress = { ...getValues('billingAddress') };
      updateCheckoutData({ billingAddress });
    }
  }, [billingAddressField]);

  const handleAddressOptionChange = (value: string) => {
    const isSameAddress = value === 'same';
    if (isSameAddress === useSameAddress || disabled) {
      return;
    }
    setUseSameAddress(isSameAddress);
    if (!isSameAddress) {
      updateCheckoutData({ billingAddress: undefined });
    } else if (checkoutData.shippingAddress) {
      updateCheckoutData({ billingAddress: checkoutData.shippingAddress });
    }
  };

  const handleGoToPayment = async () => {
    const isValid = await trigger('billingAddress');

    if (isValid && addBillingAddress) {
      const billingAddressData = getValues('billingAddress');
      await addBillingAddress(billingAddressData);
    }
  };

  return (
    <div className="billing-address-section">
      <Item className="py-0 px-0">
        <ItemContent className="gap-2">
          <ItemTitle>Dirección de facturación</ItemTitle>
          <RadioGroup
            value={useSameAddress ? 'same' : 'different'}
            onValueChange={(value) => {
              handleAddressOptionChange(value as string);
            }}
          >
            {!noShippingRequired ? (
              <>
                <Item variant={'outline'}>
                  <ItemContent>
                    <ItemTitle>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem id="same-address" value="same" />
                        <Label htmlFor="same-address">
                          Igual a la dirección de envío
                        </Label>
                      </div>
                    </ItemTitle>
                  </ItemContent>
                </Item>
                <Item variant={'outline'}>
                  <ItemContent>
                    <ItemTitle>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          id="different-address"
                          value="different"
                        />
                        <Label htmlFor="different-address">
                          Usar otra dirección de facturación
                        </Label>
                      </div>
                    </ItemTitle>

                    {!useSameAddress && (
                      <ItemDescription className="text-inherit mt-3 overflow-visible">
                        <div className="text-inherit bg-white">
                          <CustomerAddressForm
                            areaId="checkoutBillingAddressForm"
                            fieldNamePrefix="billingAddress"
                            address={undefined} // Always start empty for different address
                          />
                          {noShippingRequired && (
                            <Button
                              onClick={() => handleGoToPayment()}
                              variant="default"
                              isLoading={addingBillingAddress}
                            >
                              Continuar al pago
                            </Button>
                          )}
                        </div>
                      </ItemDescription>
                    )}
                  </ItemContent>
                </Item>
              </>
            ) : (
              <ItemDescription className="text-inherit mt-3 overflow-visible">
                <div className="text-inherit bg-white">
                  <CustomerAddressForm
                    areaId="checkoutBillingAddressForm"
                    fieldNamePrefix="billingAddress"
                    address={undefined} // Always start empty for different address
                  />
                  {noShippingRequired && (
                    <Button
                      onClick={() => handleGoToPayment()}
                      variant="default"
                      isLoading={addingBillingAddress}
                      className="mt-4"
                    >
                      Continuar al pago
                    </Button>
                  )}
                </div>
              </ItemDescription>
            )}
          </RadioGroup>
        </ItemContent>
      </Item>
    </div>
  );
}

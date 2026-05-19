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
import { useCustomer } from '@components/frontStore/customer/CustomerContext.js';
import {
  Address,
  CustomerAddressGraphql
} from '@evershop/evershop/types/customerAddress';
import React, { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

// effectiveBilling arrives in the CustomerAddressGraphql shape (camelCase,
// country/province as {code,name} objects). The form fields expect the flat
// Address shape — snake_case keys, string codes. Pushing the GraphQL shape
// straight into setValue left the country/province selects holding an object
// that matched no option, so they rendered blank.
function toFormAddress(addr?: CustomerAddressGraphql): Address | undefined {
  if (!addr) return addr;
  return {
    uuid: addr.uuid ?? null,
    full_name: addr.fullName ?? null,
    telephone: addr.telephone ?? null,
    address_1: addr.address1 ?? null,
    address_2: addr.address2 ?? null,
    city: addr.city ?? null,
    province: addr.province?.code ?? null,
    country: addr.country?.code ?? null,
    postcode: addr.postcode ?? null
  };
}

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
  const { customer } = useCustomer();
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

  // Fallback to the customer's saved default address (or the first one
  // if none is marked default) so the billing form starts pre-filled
  // instead of empty for returning customers.
  const savedDefaultAddress =
    customer?.addresses?.find((a) => a.isDefault) ||
    customer?.addresses?.[0];

  // Pick the best starting value for the billing form, in order:
  //   1. the billingAddress prop coming from the cart (if any)
  //   2. the customer's default saved address
  // If neither exists we end up with undefined and the form stays empty.
  const effectiveBilling =
    billingAddress || (savedDefaultAddress as CustomerAddressGraphql | undefined);

  const [useSameAddress, setUseSameAddress] = useState(!noShippingRequired);

  useEffect(() => {
    if (useSameAddress && shippingAddress) {
      updateCheckoutData({ billingAddress: shippingAddress });
    } else if (!useSameAddress) {
      setValue('billingAddress', toFormAddress(effectiveBilling));
    }
  }, [useSameAddress, checkoutData.shippingAddress, effectiveBilling]);

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
                            address={effectiveBilling}
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
                    address={effectiveBilling}
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

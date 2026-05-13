import Area from '@components/common/Area.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  useCartDispatch,
  useCartState
} from '@components/frontStore/cart/CartContext.js';
import {
  useCheckout,
  useCheckoutDispatch
} from '@components/frontStore/checkout/CheckoutContext.js';
import { ShippingMethods } from '@components/frontStore/checkout/shipment/ShippingMethods.js';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import { useCustomer } from '@components/frontStore/customer/CustomerContext.js';
import { MapPin } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';

// Map a customer's saved address (camelCase, with nested country/province
// objects) to the snake-case payload the cart API consumes.
function toCartAddress(a: any) {
  return {
    full_name: a?.fullName ?? '',
    telephone: a?.telephone ?? '',
    address_1: a?.address1 ?? '',
    address_2: a?.address2 ?? '',
    city: a?.city ?? '',
    country: a?.country?.code ?? '',
    province: a?.province?.code ?? '',
    postcode: a?.postcode ?? ''
  };
}

export function Shipment() {
  const {
    data: {
      shippingAddress,
      noShippingRequired,
      availableShippingMethods,
      shippingMethod: selectedShippingMethod
    },
    loadingStates: { fetchingShippingMethods }
  } = useCartState();

  // Early return if no shipping is required
  if (noShippingRequired) {
    return null;
  }

  const {
    addShippingAddress,
    addShippingMethod,
    fetchAvailableShippingMethods
  } = useCartDispatch();
  const { form } = useCheckout();
  const { updateCheckoutData } = useCheckoutDispatch();
  const { customer } = useCustomer();

  // If the cart has no shipping address yet but the logged-in customer
  // has one saved on their account, use that as the form's initial
  // values and submit it to the cart on mount so shipping methods are
  // fetched right away. The customer can still edit any field.
  const savedDefaultAddress =
    customer?.addresses?.find((a) => a.isDefault) ||
    customer?.addresses?.[0];
  const effectiveAddress = shippingAddress || savedDefaultAddress;
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (
      prefilledRef.current ||
      shippingAddress ||
      !savedDefaultAddress
    ) {
      return;
    }
    prefilledRef.current = true;
    addShippingAddress(toCartAddress(savedDefaultAddress)).catch(() => {
      // Silent — the form is already filled and the user can retry
      // by editing any field which triggers the same code path.
      prefilledRef.current = false;
    });
  }, [savedDefaultAddress, shippingAddress, addShippingAddress]);

  // Use useWatch for better performance and cleaner code
  const watchedShippingAddress = useWatch({
    control: form.control,
    name: 'shippingAddress'
  });

  const dirtyFields = form.formState.dirtyFields;
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<{
    country?: string;
    province?: string;
    postcode?: string;
  } | null>(
    // Initialize with current shipping address if available
    shippingAddress
      ? {
          country: shippingAddress.country?.code,
          province: shippingAddress.province?.code,
          postcode: shippingAddress.postcode || undefined
        }
      : null
  );

  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const country = form.getValues('shippingAddress.country');
        const province = form.getValues('shippingAddress.province');
        const postcode = form.getValues('shippingAddress.postcode');

        if (!country) {
          return;
        }

        // Check if parameters have actually changed
        const currentParams = { country, province, postcode };
        const lastParams = lastFetchParamsRef.current;

        if (
          lastParams &&
          lastParams.country === country &&
          lastParams.province === province &&
          lastParams.postcode === postcode
        ) {
          // Parameters haven't changed, skip API call
          return;
        }

        // Cache the current parameters
        lastFetchParamsRef.current = currentParams;

        await fetchAvailableShippingMethods({ country, province, postcode });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'No pudimos actualizar el envío'
        );
      }
    };

    if (watchedShippingAddress && dirtyFields.shippingAddress) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchShippingMethods();
      }, 800);
    }

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watchedShippingAddress, dirtyFields.shippingAddress]); // Clean dependency array

  const updateShipment = async (method: { code: string; name: string }) => {
    try {
      const validate = await form.trigger('shippingAddress');
      if (!validate) {
        return false;
      }
      const shippingAddress = form.getValues('shippingAddress');

      await addShippingAddress(shippingAddress);
      await addShippingMethod(method.code, method.name);
      updateCheckoutData({ shippingAddress, shippingMethod: method.code });
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No pudimos actualizar el envío'
      );
      return false;
    }
  };

  return (
    <>
      <Area id="checkoutShipmentBefore" />
      <div className="checkout__shipment space-y-6 mt-6">
        <Card className="transition-all overflow-hidden duration-200">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>Dirección de envío</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerAddressForm
              areaId="checkoutShippingAddressForm"
              fieldNamePrefix="shippingAddress"
              address={effectiveAddress}
            />
          </CardContent>
        </Card>
        <Area id="checkoutShippingMethodsBefore" noOuter />
        <ShippingMethods
          methods={availableShippingMethods?.map((method) => ({
            ...method,
            isSelected: method.code === selectedShippingMethod
          }))}
          shippingAddress={shippingAddress}
          onSelect={updateShipment}
          isLoading={fetchingShippingMethods}
        />
        <Area id="checkoutShippingMethodsAfter" noOuter />
      </div>
      <Area id="checkoutShipmentAfter" />
    </>
  );
}

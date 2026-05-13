import {
  useCartDispatch,
  useCartState
} from '@components/frontStore/cart/CartContext.js';
import React, { useState, useCallback } from 'react';

export interface ProductInfo {
  sku: string;
  isInStock: boolean;
}

export interface AddToCartState {
  isLoading: boolean;
  error: string | null;
  canAddToCart: boolean;
  isInStock: boolean;
}

export interface AddToCartActions {
  addToCart: () => Promise<void>;
  clearError: () => void;
}

export interface AddToCartProps {
  product: ProductInfo;
  qty: number; // Quantity to add to cart
  onSuccess?: (quantity: number) => void;
  onError?: (error: string) => void;
  children: (
    state: AddToCartState,
    actions: AddToCartActions
  ) => React.ReactNode;
}

export const AddToCart: React.FC<AddToCartProps> = ({
  product,
  qty,
  onSuccess,
  onError,
  children
}) => {
  const cartDispatch = useCartDispatch();
  const cartState = useCartState();
  const [localError, setLocalError] = useState<string | null>(null);
  const canAddToCart = product.isInStock && qty > 0 && !!cartState.data;

  const isLoading = cartState.loading;

  const clearError = useCallback(() => {
    setLocalError(null);
    cartDispatch.clearError();
  }, [cartDispatch]);

  const addToCart = useCallback(async () => {
    if (!canAddToCart) {
      const errorMsg = !product.isInStock
        ? 'Producto sin stock'
        : !cartState.data
        ? 'El carrito no está inicializado'
        : 'Cantidad inválida';

      setLocalError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setLocalError(null);
      cartDispatch.clearError();
      await cartDispatch.addItem({
        sku: product.sku,
        qty: qty
      });
      onSuccess?.(qty);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No pudimos agregar el producto';
      setLocalError(errorMessage);
      onError?.(errorMessage);
    }
  }, [
    canAddToCart,
    product.isInStock,
    product.sku,
    qty,
    cartState.data,
    cartDispatch,
    onSuccess,
    onError
  ]);

  const state: AddToCartState = {
    isLoading,
    error: localError || cartState.data?.error || null,
    canAddToCart,
    isInStock: product.isInStock
  };

  const actions: AddToCartActions = {
    addToCart,
    clearError
  };

  return <>{children(state, actions)}</>;
};

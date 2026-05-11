import { ShoppingCart } from 'lucide-react';
import React from 'react';

export const DefaultMiniCartIcon = ({
  totalQty,
  onClick,
  isOpen,
  disabled = false,
  showItemCount = true,
  syncStatus
}: {
  totalQty: number;
  onClick: () => void;
  isOpen: boolean;
  disabled?: boolean;
  showItemCount?: boolean;
  syncStatus: { syncing: boolean };
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mini-cart-icon relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer text-gray-700 hover:bg-rose-50 hover:text-rose-600'
      } ${isOpen ? 'bg-rose-50 text-rose-600' : ''}`}
      aria-label={`Carrito con ${totalQty} ${totalQty === 1 ? 'producto' : 'productos'}`}
    >
      {syncStatus.syncing ? (
        <div className="animate-spin rounded-full h-[18px] w-[18px] border-2 border-current border-t-transparent" />
      ) : (
        <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.75} />
      )}
      {showItemCount && totalQty > 0 && !syncStatus.syncing && (
        <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm ring-2 ring-white">
          {totalQty > 99 ? '99+' : totalQty}
        </span>
      )}
    </button>
  );
};

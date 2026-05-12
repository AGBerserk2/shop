import React from 'react';
import { useQuery } from 'urql';

const QUERY = `
  query SidebarBrandData {
    setting {
      storeName
      storeLogo
    }
  }
`;

export function SidebarBrand() {
  const [result] = useQuery({ query: QUERY });
  const setting = result?.data?.setting;
  const storeName = setting?.storeName || 'Anroy';
  const storeLogo = setting?.storeLogo;

  return (
    <div className="flex items-center justify-center px-2 py-5">
      {storeLogo ? (
        <img
          src={storeLogo}
          alt={storeName}
          className="h-16 w-auto max-w-[200px] object-contain"
        />
      ) : (
        <div className="font-display text-3xl italic text-white tracking-tight">
          {storeName}
        </div>
      )}
    </div>
  );
}

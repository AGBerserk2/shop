import React from 'react';
import { useQuery } from 'urql';

const QUERY = `
  query SidebarBrandData {
    currentAdminUser {
      adminUserId
      fullName
      email
    }
    setting {
      storeName
      storeLogo
    }
  }
`;

function initials(name?: string | null): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'A';
}

export function SidebarBrand() {
  const [result] = useQuery({ query: QUERY });
  const user = result?.data?.currentAdminUser;
  const setting = result?.data?.setting;
  const storeName = setting?.storeName || 'Anroy';
  const storeLogo = setting?.storeLogo;

  return (
    <div className="px-2 pb-3 border-b border-white/10">
      {/* Brand line */}
      <div className="flex items-center gap-2.5 px-2 pb-4">
        {storeLogo ? (
          <img
            src={storeLogo}
            alt={storeName}
            className="h-8 w-auto max-w-[140px] object-contain bg-white/95 rounded-md p-1"
          />
        ) : (
          <div className="text-lg font-extrabold tracking-tight text-white">
            {storeName}
          </div>
        )}
      </div>

      {/* User profile block */}
      <div className="flex flex-col items-center text-center pt-3 pb-5">
        <div className="w-16 h-16 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner">
          {initials(user?.fullName || user?.email)}
        </div>
        <div className="mt-3 text-sm font-bold text-white truncate w-full">
          {user?.fullName || 'Administrador'}
        </div>
        {user?.email && (
          <div className="text-[11px] text-white/60 truncate w-full">
            {user.email}
          </div>
        )}
      </div>
    </div>
  );
}

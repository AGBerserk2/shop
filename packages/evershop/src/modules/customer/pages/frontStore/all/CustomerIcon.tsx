import { CircleUser } from 'lucide-react';
import React from 'react';

interface UserIconProps {
  customer: {
    uuid: string;
    fullName: string;
    email: string;
  };
  accountUrl: string;
  loginUrl: string;
}

export default function UserIcon({
  customer,
  accountUrl,
  loginUrl
}: UserIconProps) {
  return (
    <div className="self-center customer-icon">
      <a
        href={customer ? accountUrl : loginUrl}
        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        aria-label={customer ? `Cuenta de ${customer.fullName}` : 'Iniciar sesión'}
        title={customer ? customer.fullName || 'Mi cuenta' : 'Iniciar sesión'}
      >
        <CircleUser className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </a>
    </div>
  );
}

export const layout = {
  areaId: 'headerMiddleRight',
  sortOrder: 10
};

export const query = `
  query Query {
    customer: currentCustomer {
      uuid
      fullName
      email
    }
    accountUrl: url(routeId: "account")
    loginUrl: url(routeId: "login")
  }
`;

import { LogOut } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';
import { useQuery } from 'urql';

const QUERY = `
  query LogoutLinks {
    logoutUrl: url(routeId: "adminLogoutJson")
    loginPage: url(routeId: "adminLogin")
  }
`;

export function SidebarLogout() {
  const [result] = useQuery({ query: QUERY });
  const logoutUrl = result?.data?.logoutUrl;
  const loginPage = result?.data?.loginPage;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!logoutUrl) return;
    try {
      const res = await fetch(logoutUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.status === 200 && loginPage) {
        window.location.href = loginPage;
      } else {
        toast.error('No se pudo cerrar sesión');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error de conexión');
    }
  };

  return (
    <div className="px-2 pt-3 border-t border-white/10">
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.75} />
        Cerrar sesión
      </button>
    </div>
  );
}

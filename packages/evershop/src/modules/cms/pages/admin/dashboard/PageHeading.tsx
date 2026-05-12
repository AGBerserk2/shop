import { Bell, Search } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';

const QUERY = `
  query DashboardHeader {
    currentAdminUser {
      fullName
      email
    }
    setting {
      storeName
    }
  }
`;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// Welcome strip that replaces the generic "Dashboard" title. Personalized
// greeting on the left, search shortcut + notifications hint on the right.
export default function DashboardPageHeading() {
  const [result] = useQuery({ query: QUERY });
  const user = result?.data?.currentAdminUser;
  const storeName = result?.data?.setting?.storeName || 'Anroy';
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : '';

  const openPalette = () => {
    // Reuse the global ⌘K palette via synthesized keydown.
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        bubbles: true
      })
    );
  };

  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {greeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {storeName} · panel de control
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openPalette}
          className="group inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-white text-sm text-muted-foreground border border-border hover:bg-accent hover:border-primary/40 transition-colors min-w-64"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" strokeWidth={1.75} />
          <span className="flex-1 text-left">Buscar productos, pedidos…</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/50">
            ⌘K
          </span>
        </button>
      </div>
    </header>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

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

function todayLabel(): string {
  try {
    return new Date().toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  } catch {
    return new Date().toDateString();
  }
}

// Editorial welcome strip. Big italic display serif for warmth, refined sans
// for the supporting copy. Search pill that triggers the global ⌘K palette.
export default function DashboardPageHeading() {
  const [result] = useQuery({ query: QUERY });
  const user = result?.data?.currentAdminUser;
  const storeName = result?.data?.setting?.storeName || 'Anroy';
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : '';

  const openPalette = () => {
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
    <header className="mb-8 anroy-rise" style={{ animationDelay: '40ms' }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            {todayLabel()}
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-foreground">
            <span className="italic">{greeting()}</span>
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            Esto es lo que pasa en{' '}
            <span className="font-semibold text-foreground">{storeName}</span> ahora.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-end">
          <button
            type="button"
            onClick={openPalette}
            className="group hidden md:inline-flex items-center gap-2 pl-3 pr-1.5 py-2 rounded-full bg-card text-sm text-muted-foreground border border-border hover:border-primary/40 hover:shadow-sm transition-all w-72"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" strokeWidth={1.75} />
            <span className="flex-1 text-left">Buscar productos, pedidos…</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/60 text-muted-foreground">
              ⌘K
            </span>
          </button>

          <button
            type="button"
            onClick={openPalette}
            className="md:hidden w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </header>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

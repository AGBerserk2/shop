import { Button } from '@components/common/ui/Button.js';
import { Calendar, ChevronDown } from 'lucide-react';
import React from 'react';

export type Range = { from: string; to: string; label: string };

const PRESETS: { id: string; label: string; build: () => Range }[] = [
  {
    id: 'today',
    label: 'Hoy',
    build: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Hoy' };
    }
  },
  {
    id: 'yesterday',
    label: 'Ayer',
    build: () => {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - 1);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Ayer' };
    }
  },
  {
    id: '7d',
    label: 'Últimos 7 días',
    build: () => {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Últimos 7 días' };
    }
  },
  {
    id: '30d',
    label: 'Últimos 30 días',
    build: () => {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Últimos 30 días' };
    }
  },
  {
    id: 'month',
    label: 'Este mes',
    build: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Este mes' };
    }
  },
  {
    id: 'lastMonth',
    label: 'Mes anterior',
    build: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Mes anterior' };
    }
  },
  {
    id: 'ytd',
    label: 'Año a la fecha',
    build: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return { from: start.toISOString(), to: end.toISOString(), label: 'Año a la fecha' };
    }
  }
];

const DateRangeContext = React.createContext<{
  range: Range;
  setPreset: (id: string) => void;
} | null>(null);

export function useDateRange() {
  const ctx = React.useContext(DateRangeContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (eg. via Area)
    return { range: PRESETS[3].build(), setPreset: () => undefined };
  }
  return ctx;
}

const DEFAULT_PRESET_ID = '30d';

function readInitialPreset(): { presetId: string; range: Range } {
  if (typeof window === 'undefined') {
    return { presetId: DEFAULT_PRESET_ID, range: PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!.build() };
  }
  const stored = window.localStorage?.getItem('anroy.dashboardRange');
  const candidate = stored && PRESETS.find((p) => p.id === stored) ? stored : DEFAULT_PRESET_ID;
  return { presetId: candidate, range: PRESETS.find((p) => p.id === candidate)!.build() };
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetId] = React.useState<string>(() => readInitialPreset().presetId);
  const [range, setRange] = React.useState<Range>(() => readInitialPreset().range);

  const setPreset = React.useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setRange(preset.build());
    try {
      window.localStorage?.setItem('anroy.dashboardRange', id);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <DateRangeContext.Provider value={{ range, setPreset }}>
      <div data-active-preset={presetId}>{children}</div>
    </DateRangeContext.Provider>
  );
}

export function DateRangePicker() {
  const ctx = React.useContext(DateRangeContext);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!triggerRef.current?.parentElement?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!ctx) return null;
  const { range, setPreset } = ctx;

  return (
    <div className="relative inline-block">
      <Button
        ref={triggerRef as any}
        type="button"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="gap-2"
      >
        <Calendar className="w-4 h-4" />
        {range.label}
        <ChevronDown className="w-4 h-4 opacity-60" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-popover text-popover-foreground border border-border rounded-md shadow-lg z-50 py-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPreset(p.id);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${
                range.label === p.label ? 'bg-accent font-medium' : ''
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

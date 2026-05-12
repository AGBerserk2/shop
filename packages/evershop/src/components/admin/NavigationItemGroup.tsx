import {
  NavigationItem,
  NavigationItemProps
} from '@components/admin/NavigationItem.js';
import Area from '@components/common/Area.jsx';
import { ChevronDown } from 'lucide-react';
import React from 'react';
import './NavigationItemGroup.scss';

interface NavigationItemGroupProps {
  id: string;
  name: string;
  items: NavigationItemProps[];
  Icon: React.ElementType | null;
  url: string | null;
}

const STORAGE_PREFIX = 'anroy.sidebar.group.';

function readInitialOpen(id: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_PREFIX + id);
    if (stored === null) return true;
    return stored === '1';
  } catch {
    return true;
  }
}

export function NavigationItemGroup({
  id,
  name,
  items = [],
  Icon = null,
  url = null
}: NavigationItemGroupProps) {
  const [open, setOpen] = React.useState<boolean>(() => readInitialOpen(id));

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(STORAGE_PREFIX + id, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <li className={`root-nav-item nav-item ${open ? '' : 'closed'}`}>
      <button
        type="button"
        onClick={toggle}
        className="root-label group"
        aria-expanded={open}
      >
        <span className="flex-1 text-left">{name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
          strokeWidth={2}
        />
      </button>
      <ul className="item-group">
        <Area
          id={id}
          noOuter
          coreComponents={items.map((item) => ({
            component: {
              default: () => (
                <NavigationItem
                  Icon={item.Icon}
                  url={item.url}
                  title={item.title}
                />
              )
            }
          }))}
        />
      </ul>
    </li>
  );
}

NavigationItemGroup.defaultProps = {
  items: [],
  Icon: null,
  url: null
};

import { useAppState } from '@components/common/context/app.js';
import { generateComponentKey } from '@evershop/evershop/lib/util/keyGenerator';
import type { WidgetInstance } from '@evershop/evershop/types/widget';
import React, { useEffect, useState } from 'react';
import type { ElementType } from 'react';

interface Component {
  id?: string;
  sortOrder?: number;
  props?: Record<string, any>;
  component: {
    default: React.ElementType | React.ReactNode;
  };
}

type AreaID = string;
type ComponentID = string;

interface Components {
  [key: AreaID]: {
    [key: ComponentID]: Component;
  };
}

interface AreaProps {
  className?: string;
  coreComponents?: Component[];
  id: string;
  noOuter?: boolean;
  wrapper?: React.ReactNode | string;
  wrapperProps?: Record<string, any>;
  components?: Components;
  [key: string]: unknown;
}

const DEBUG_KEY = 'evershop_area_debug';

let toggleButtonMounted = false;
let debugStylesMounted = false;

function injectDebugStyles() {
  if (process.env.NODE_ENV !== 'development') return;
  if (debugStylesMounted || typeof document === 'undefined') return;
  debugStylesMounted = true;
  const style = document.createElement('style');
  style.id = 'evershop-debug-styles';
  style.textContent = [
    '.evershop-debug-area__badge { opacity: 0; transition: opacity 0.15s ease; }',
    '.evershop-debug-area:hover > .evershop-debug-area__badge { opacity: 1; }'
  ].join('\n');
  document.head.appendChild(style);
}

function injectToggleButton() {
  if (process.env.NODE_ENV !== 'development') return;
  if (toggleButtonMounted || typeof document === 'undefined') return;
  toggleButtonMounted = true;

  const btn = document.createElement('button');

  const update = () => {
    const active = localStorage.getItem(DEBUG_KEY) === '1';
    btn.textContent = active ? 'Debug: ON' : 'Debug: OFF';
    btn.style.background = active ? '#3b82f6' : '#6b7280';
  };

  Object.assign(btn.style, {
    position: 'fixed',
    // Sit above the mobile bottom tab bar (≈72px tall) on small viewports
    // so the dev toggle never overlaps storefront UI in development.
    bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
    right: '16px',
    zIndex: '99999',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'background 0.2s'
  });

  btn.title = 'Toggle Area debug mode';
  update();

  btn.addEventListener('click', () => {
    const next = localStorage.getItem(DEBUG_KEY) === '1' ? '0' : '1';
    localStorage.setItem(DEBUG_KEY, next);
    // Notify all tabs and same-page listeners
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: DEBUG_KEY,
        newValue: next,
        storageArea: localStorage
      })
    );
    update();
  });

  document.body.appendChild(btn);
}

function useDebugMode(): boolean {
  const [debug, setDebug] = useState(() => {
    if (process.env.NODE_ENV !== 'development') return false;
    try {
      return localStorage.getItem(DEBUG_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    injectToggleButton();
    injectDebugStyles();

    const handler = (e: StorageEvent) => {
      if (e.key === DEBUG_KEY) {
        setDebug(e.newValue === '1');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return debug;
}

const AREA_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
  '#db2777',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f43f5e'
];

// Stable color per area ID
function areaColor(id: string | undefined): string {
  if (!id) return AREA_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AREA_COLORS[Math.abs(hash) % AREA_COLORS.length];
}

function Area(props: AreaProps) {
  const context = useAppState();
  const debug = useDebugMode();
  const {
    id,
    coreComponents,
    wrapperProps,
    noOuter,
    wrapper,
    className,
    components
  } = props;

  const areaComponents = (() => {
    const areaCoreComponents = coreComponents || [];
    const widgets = context.widgets || [];
    const wildCardWidgets = components?.['*'] || {};
    const assignedWidgets: Component[] = [];

    widgets.forEach((widget: WidgetInstance) => {
      const adminKey = generateComponentKey(`admin_widget_${widget.type}`);
      const frontKey = generateComponentKey(`widget_${widget.type}`);
      const w = wildCardWidgets[adminKey] || wildCardWidgets[frontKey];
      if (widget.areaId.includes(id) && w !== undefined) {
        assignedWidgets.push({
          id: widget.id,
          sortOrder: widget.sortOrder,
          props: widget.props,
          component: w.component
        });
      }
    });
    const cs =
      components?.[id] === undefined
        ? areaCoreComponents.concat(assignedWidgets)
        : areaCoreComponents
            .concat(Object.values(components[id]))
            .concat(assignedWidgets);
    return cs.sort(
      (obj1, obj2) => (obj1.sortOrder || 0) - (obj2.sortOrder || 0)
    );
  })();
  const { propsMap } = context;
  // In debug mode, always use a real wrapper element so borders/badges can render.
  // noOuter is intentionally ignored when debug is active.
  // The process.env.NODE_ENV guard lets Terser statically eliminate this in production.
  const effectiveNoOuter =
    process.env.NODE_ENV === 'development' && debug ? false : noOuter;

  let WrapperComponent: ElementType = React.Fragment;
  if (effectiveNoOuter !== true) {
    if (wrapper !== undefined) {
      WrapperComponent = wrapper as ElementType;
    } else {
      WrapperComponent = 'div';
    }
  }

  let areaWrapperProps: Record<string, any> = {};
  if (effectiveNoOuter === true) {
    areaWrapperProps = {};
  } else if (typeof wrapperProps === 'object' && wrapperProps !== null) {
    areaWrapperProps = { className: className || '', ...wrapperProps };
  } else {
    areaWrapperProps = { className: className || '' };
  }

  const color =
    process.env.NODE_ENV === 'development' && debug ? areaColor(id) : '';

  if (
    process.env.NODE_ENV === 'development' &&
    debug &&
    effectiveNoOuter !== true
  ) {
    const existingStyle = areaWrapperProps.style || {};
    const existingClass = (areaWrapperProps.className || '') as string;
    areaWrapperProps = {
      ...areaWrapperProps,
      className: `${existingClass} evershop-debug-area`.trim(),
      style: {
        ...existingStyle,
        position: 'relative',
        border: `2px dashed ${color}`,
        padding: '5px',
        boxSizing: 'border-box',
        minHeight: '32px'
      }
    };
  }

  const renderedChildren = areaComponents.map((w, index) => {
    const C = w.component.default;

    const { id: componentId } = w;
    const propsData = context.graphqlResponse;
    const propKeys =
      componentId !== undefined ? propsMap[componentId] || [] : [];

    const componentProps = propKeys.reduce(
      (acc: Record<string, any>, map: Record<string, any>) => {
        const { origin, alias } = map;
        acc[origin] = propsData[alias];
        return acc;
      },
      {}
    );
    if (w.props) {
      Object.assign(componentProps, w.props);
    }

    let rendered: React.ReactNode = null;

    if (React.isValidElement(C)) {
      rendered = <React.Fragment key={index}>{C}</React.Fragment>;
    } else if (typeof C === 'string') {
      rendered = <C key={index} {...componentProps} />;
    } else if (typeof C === 'function') {
      rendered = <C key={index} areaProps={props} {...componentProps} />;
    }

    if (!debug || rendered === null || process.env.NODE_ENV !== 'development') {
      return rendered;
    }

    return (
      <div
        key={index}
        className="evershop-debug-child"
        style={{
          position: 'relative',
          outline: `1px solid ${color}40`,
          outlineOffset: '1px'
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 9999,
            background: `${color}cc`,
            color: '#fff',
            fontSize: '9px',
            fontFamily: 'monospace',
            padding: '1px 5px',
            borderRadius: '0 0 0 4px',
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          order: {w.sortOrder ?? 0}
        </span>
        {rendered}
      </div>
    );
  });

  if (process.env.NODE_ENV === 'development' && debug) {
    return (
      <WrapperComponent {...areaWrapperProps}>
        <span
          className="evershop-debug-area__badge"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999,
            background: color,
            color: '#fff',
            fontSize: '10px',
            fontFamily: 'monospace',
            padding: '1px 6px',
            borderRadius: '0 0 4px 0',
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            cursor: 'default'
          }}
          title={`Area: #${id}`}
        >
          #{id}
        </span>
        {renderedChildren}
      </WrapperComponent>
    );
  }

  return (
    <WrapperComponent {...areaWrapperProps}>
      {renderedChildren}
    </WrapperComponent>
  );
}

Area.defaultProps = {
  className: undefined,
  coreComponents: [],
  noOuter: false,
  wrapper: 'div',
  wrapperProps: {}
};

export { Area };
export default Area;

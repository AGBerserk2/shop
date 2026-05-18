import React from 'react';
import { useQuery } from 'urql';
import './DriverApp.scss';

const QUERY = `
  query DriverData($token: ID!) {
    driverDelivery(token: $token) {
      status
      token
      orderNumber
      customerName
      customerPhone
      address
    }
    updateLocationApi: url(routeId: "updateDriverLocation")
    markDeliveredApi: url(routeId: "markDeliveredByDriver")
  }
`;

// The token lives in the page URL (/entrega/<token>). Read it client-side.
function getTokenFromUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const parts = window.location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('entrega');
  return i >= 0 && parts[i + 1] ? parts[i + 1] : '';
}

// watchPosition can fire often — only POST every ~12s.
const POST_INTERVAL_MS = 12000;

export default function DriverApp() {
  const [token, setToken] = React.useState('');
  React.useEffect(() => {
    setToken(getTokenFromUrl());
  }, []);

  const [result] = useQuery({
    query: QUERY,
    variables: { token },
    pause: !token
  });
  const data = result.data;
  const delivery = data?.driverDelivery;

  const [sharing, setSharing] = React.useState(false);
  const [lastSent, setLastSent] = React.useState<Date | null>(null);
  const [delivered, setDelivered] = React.useState(false);
  const [working, setWorking] = React.useState(false);
  const watchRef = React.useRef<number | null>(null);
  const lastPostRef = React.useRef(0);

  const postLocation = React.useCallback(
    async (lat: number, lng: number) => {
      if (!data?.updateLocationApi || !token) {
        return;
      }
      try {
        await fetch(data.updateLocationApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, latitude: lat, longitude: lng })
        });
        setLastSent(new Date());
      } catch {
        /* a dropped ping is fine — the next one will land */
      }
    },
    [data?.updateLocationApi, token]
  );

  const stopSharing = React.useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
  }, []);

  const startSharing = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Tu teléfono no permite compartir la ubicación.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastPostRef.current < POST_INTERVAL_MS) {
          return;
        }
        lastPostRef.current = now;
        postLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        alert('No pudimos leer tu ubicación. Activá el GPS y permití el acceso.');
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    watchRef.current = id;
    setSharing(true);
  };

  // Clear the GPS watch if the page unmounts.
  React.useEffect(
    () => () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    },
    []
  );

  const markDelivered = async () => {
    if (!data?.markDeliveredApi || !token || working) {
      return;
    }
    if (!window.confirm('¿Confirmás que entregaste el pedido?')) {
      return;
    }
    setWorking(true);
    try {
      const res = await fetch(data.markDeliveredApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.error) {
        alert(body?.error?.message || 'No se pudo marcar como entregado.');
        setWorking(false);
        return;
      }
      stopSharing();
      setDelivered(true);
    } catch {
      alert('No se pudo marcar como entregado.');
      setWorking(false);
    }
  };

  const isLoading = !token || (result.fetching && !data);
  const isDelivered = delivered || delivery?.status === 'delivered';

  return (
    <div className="anroy-driver">
      <div className="anroy-driver__shell">
        <div className="anroy-driver__brand">ANROY</div>

        {isLoading && (
          <div className="anroy-driver__state">Cargando entrega…</div>
        )}

        {!isLoading && !delivery && (
          <div className="anroy-driver__state">
            <div className="anroy-driver__state-icon" aria-hidden>
              ✕
            </div>
            <h1 className="anroy-driver__state-title">Enlace no válido</h1>
            <p className="anroy-driver__state-sub">
              Este enlace de entrega no existe o ya venció. Pedile uno nuevo a
              la tienda.
            </p>
          </div>
        )}

        {!isLoading && delivery && isDelivered && (
          <div className="anroy-driver__state">
            <div
              className="anroy-driver__state-icon anroy-driver__state-icon--ok"
              aria-hidden
            >
              ✓
            </div>
            <h1 className="anroy-driver__state-title">Entrega completada</h1>
            <p className="anroy-driver__state-sub">
              ¡Gracias! El pedido #{delivery.orderNumber} quedó entregado.
            </p>
          </div>
        )}

        {!isLoading && delivery && !isDelivered && (
          <>
            <h1 className="anroy-driver__title">
              Entrega <em>#{delivery.orderNumber}</em>
            </h1>

            <div className="anroy-driver__card">
              <div className="anroy-driver__label">Cliente</div>
              <div className="anroy-driver__value">
                {delivery.customerName || 'Cliente'}
              </div>
              <div className="anroy-driver__label">Dirección</div>
              <div className="anroy-driver__value">
                {delivery.address || 'Sin dirección registrada'}
              </div>
              {delivery.customerPhone && (
                <a
                  className="anroy-driver__call"
                  href={`tel:${delivery.customerPhone}`}
                >
                  Llamar al cliente
                </a>
              )}
            </div>

            <div className="anroy-driver__share">
              {sharing ? (
                <>
                  <div className="anroy-driver__sharing">
                    <span className="anroy-driver__pulse" aria-hidden />
                    Compartiendo tu ubicación
                  </div>
                  <div className="anroy-driver__hint">
                    {lastSent
                      ? `Última actualización: ${lastSent.toLocaleTimeString(
                          'es-DO',
                          { hour: '2-digit', minute: '2-digit' }
                        )}`
                      : 'Esperando la primera señal del GPS…'}
                  </div>
                  <button
                    type="button"
                    className="anroy-driver__stop"
                    onClick={stopSharing}
                  >
                    Detener
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="anroy-driver__btn"
                  onClick={startSharing}
                >
                  Compartir mi ubicación
                </button>
              )}
            </div>

            <button
              type="button"
              className="anroy-driver__btn anroy-driver__btn--done"
              onClick={markDelivered}
              disabled={working}
            >
              {working ? 'Enviando…' : 'Marcar como entregado'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

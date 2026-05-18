import React from 'react';
import { useQuery } from 'urql';
import 'leaflet/dist/leaflet.css';
import './DeliveryMap.scss';

const QUERY = `
  query DeliveryTracking($orderUuid: ID!) {
    delivery(orderUuid: $orderUuid) {
      status
      driverName
      driverLatitude
      driverLongitude
      destLatitude
      destLongitude
      locationUpdatedAt
    }
  }
`;

const POLL_INTERVAL_MS = 15000;

interface DeliveryMapProps {
  orderUuid: string;
}

// Live map of the delivery driver, shown on the customer's order card.
// Renders nothing unless the order is actively "en route".
export default function DeliveryMap({ orderUuid }: DeliveryMapProps) {
  const [result, reexecute] = useQuery({
    query: QUERY,
    variables: { orderUuid },
    pause: !orderUuid,
    requestPolicy: 'network-only'
  });
  const delivery = result.data?.delivery;
  const enRoute = delivery?.status === 'en_route';

  // Poll the driver location every 15s while en route.
  React.useEffect(() => {
    if (!enRoute) {
      return undefined;
    }
    const timer = setInterval(() => {
      reexecute({ requestPolicy: 'network-only' });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enRoute, reexecute]);

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const driverMarkerRef = React.useRef<any>(null);

  const driverLat = delivery?.driverLatitude;
  const driverLng = delivery?.driverLongitude;
  const hasDriver =
    enRoute && typeof driverLat === 'number' && typeof driverLng === 'number';

  // Initialise the Leaflet map once the driver has a position. Leaflet is
  // imported dynamically so it never runs during server-side rendering.
  React.useEffect(() => {
    if (!hasDriver || !mapElRef.current || mapRef.current) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapElRef.current || mapRef.current) {
        return;
      }
      const map = L.map(mapElRef.current, {
        zoomControl: true,
        attributionControl: false
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      const driverIcon = L.divIcon({
        className: 'anroy-mapwrap__driver-pin',
        html: '<span></span>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      driverMarkerRef.current = L.marker([driverLat, driverLng], {
        icon: driverIcon
      }).addTo(map);

      const destLat = delivery?.destLatitude;
      const destLng = delivery?.destLongitude;
      if (typeof destLat === 'number' && typeof destLng === 'number') {
        const destIcon = L.divIcon({
          className: 'anroy-mapwrap__dest-pin',
          html: '<span></span>',
          iconSize: [20, 26],
          iconAnchor: [10, 26]
        });
        L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
        map.fitBounds(
          [
            [driverLat, driverLng],
            [destLat, destLng]
          ],
          { padding: [40, 40], maxZoom: 16 }
        );
      } else {
        map.setView([driverLat, driverLng], 15);
      }
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
    };
  }, [hasDriver]);

  // Move the driver marker as new positions arrive.
  React.useEffect(() => {
    if (!mapRef.current || !driverMarkerRef.current || !hasDriver) {
      return;
    }
    driverMarkerRef.current.setLatLng([driverLat, driverLng]);
    mapRef.current.panTo([driverLat, driverLng]);
  }, [driverLat, driverLng, hasDriver]);

  // Tear the map down on unmount.
  React.useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    },
    []
  );

  if (!enRoute) {
    return null;
  }

  return (
    <div className="anroy-mapwrap">
      <div className="anroy-mapwrap__head">
        <span className="anroy-mapwrap__dot" aria-hidden />
        {delivery.driverName
          ? `${delivery.driverName} va en camino`
          : 'Tu pedido va en camino'}
      </div>
      {hasDriver ? (
        <div className="anroy-mapwrap__map" ref={mapElRef} />
      ) : (
        <div className="anroy-mapwrap__waiting">
          Esperando la ubicación del repartidor…
        </div>
      )}
    </div>
  );
}

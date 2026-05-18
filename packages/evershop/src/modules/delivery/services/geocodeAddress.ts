import { error } from '../../../lib/log/logger.js';

interface Coords {
  lat: number;
  lng: number;
}

// Best-effort geocoding via OpenStreetMap Nominatim (free, no API key).
// Returns null on any failure — callers must handle a missing result, since
// a wrong destination pin would be worse than none.
export async function geocodeAddress(address: {
  address_1?: string | null;
  city?: string | null;
}): Promise<Coords | null> {
  try {
    const query = [address.address_1, address.city, 'República Dominicana']
      .filter(Boolean)
      .join(', ');
    if (!query) {
      return null;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Anroy-Store/1.0 (delivery geocoding)' }
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(json) || json.length === 0) {
      return null;
    }
    const lat = Number(json[0].lat);
    const lng = Number(json[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return { lat, lng };
  } catch (e) {
    error(e);
    return null;
  }
}

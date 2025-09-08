import { Linking, Platform } from 'react-native';

export type MapProviderName = 'osm' | 'google';
type Coords = { latitude: number; longitude: number };

export type StaticOpts = {
  zoom?: number;              // default 15
  size?: `${number}x${number}`;              // "640x320"
  scale?: 1 | 2 | 3;          // Google only
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'; // Google only
  googleApiKey?: string;      // optional (prefer server-signed URLs in prod)
  osmServer?: string;         // custom OSM static server base
  osmApiKey?: string; 
  markerColor?: string;  
};

export function staticMapUrl(
  provider: MapProviderName,
  { latitude, longitude }: { latitude: number; longitude: number },
  opts: StaticOpts = {}
): { url: string; width: number; height: number } {
  const zoom = opts.zoom ?? 15;

  // Parse size safely and coerce to numbers
  const [wStr, hStr] = (opts.size ?? '640x320').split('x');
  const width = Number(wStr) || 640;
  const height = Number(hStr) || 320;

  const lat = latitude;
  const lng = longitude;

  let url = '';

  if (provider === 'google') {
    const scale = opts.scale ?? 2;
    const mapType = opts.mapType ?? 'roadmap';
    const markerColor = opts.markerColor ?? 'red';

    // NOTE: use a Google Maps **Static API** key (web service key, no HTTP referrer restriction)
    const key = opts.googleApiKey ? `&key=${encodeURIComponent(opts.googleApiKey)}` : '';

    url =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${lat},${lng}` +
      `&zoom=${zoom}` +
      `&size=${width}x${height}` +
      `&scale=${scale}` +
      `&maptype=${mapType}` +
      `&markers=color:${encodeURIComponent(markerColor)}|${lat},${lng}` +
      key;
  } else {
    // OSM via LocationIQ
    // Docs: https://locationiq.com/docs#static-maps
    const marker = `icon:large-red-cutout|${lat},${lng}`;
    const key = opts.osmApiKey ? `key=${encodeURIComponent(opts.osmApiKey)}` : '';
    const qp =
      `${key}` +
      `&center=${lat},${lng}` +
      `&zoom=${zoom}` +
      `&size=${width}x${height}` +
      `&markers=${encodeURIComponent(marker)}`;

    url = `https://maps.locationiq.com/v3/staticmap?${qp}`;
  }

  return { url, width, height };
}


export async function mapsDeepLink(
  provider: 'google' | 'osm' | 'apple',
  { latitude, longitude }: { latitude: number; longitude: number }
): Promise<string> {
  const q = `${latitude},${longitude}`;
  const encQ = encodeURIComponent(q);

  if (Platform.OS === 'ios') {
    if (provider === 'google') {
      // Try Google Maps app first
      const gmScheme = `comgooglemaps://?q=${encQ}`;
      try {
        if (await Linking.canOpenURL(gmScheme)) return gmScheme;
      } catch {}
      // Fallback to Google Maps web
      return `https://www.google.com/maps/search/?api=1&query=${encQ}`;
    }
    if (provider === 'osm') {
      // OSM opens in Safari
      return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
    }
    // Default iOS: Apple Maps
    return `https://maps.apple.com/?ll=${q}&q=${encQ}`;
  }

  // ANDROID
  if (provider === 'google') {
    // geo: is handled by Google Maps or any compatible app
    return `geo:${q}?q=${encQ}`;
  }
  if (provider === 'osm') {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  }
  return `geo:${q}?q=${encQ}`;
}

export const providerLabel = (p: MapProviderName) => (p === 'google' ? 'Google Maps' : 'OpenStreetMap');
export const providerAttribution = (p: MapProviderName) => (p === 'google' ? undefined : '© OpenStreetMap contributors');

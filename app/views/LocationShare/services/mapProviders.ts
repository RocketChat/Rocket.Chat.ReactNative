import { Linking, Platform } from 'react-native';

import I18n from '../../../i18n';

export type MapProviderName = 'google' | 'osm';
type AppleProvider = 'apple';
type AnyProvider = MapProviderName | AppleProvider;
type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export type Coords = { latitude: number; longitude: number; accuracy?: number; timestamp?: number };

export type StaticOpts = {
  zoom?: number;
  size?: `${number}x${number}`;
  scale?: 1 | 2 | 3;
  mapType?: GoogleMapType;
  googleApiKey?: string;
  markerColor?: string;
};

const DEFAULT_ZOOM = 15;
const DEFAULT_SIZE = '640x320';
const DEFAULT_GOOGLE_SCALE: 1 | 2 | 3 = 2;
const DEFAULT_GOOGLE_MAPTYPE: GoogleMapType = 'roadmap';
const DEFAULT_MARKER_COLOR = 'red';

const GOOGLE_STATIC_BASE = 'https://maps.googleapis.com/maps/api/staticmap';
const OSM_TILE_BASE = 'https://tile.openstreetmap.org';

function parseSize(size: StaticOpts['size'] | undefined) {
  const [wStr, hStr] = (size ?? DEFAULT_SIZE).split('x');
  const width = Number(wStr) || 640;
  const height = Number(hStr) || 320;
  return { width, height };
}

function enc(s: string | number) {
  return encodeURIComponent(String(s));
}

function lonLatToTile(lon: number, lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function buildGoogleStaticUrl(
  { latitude, longitude }: Coords,
  { zoom, size, scale, mapType, googleApiKey, markerColor }: StaticOpts
): { url: string; width: number; height: number } {
  const z = zoom ?? DEFAULT_ZOOM;
  const { width, height } = parseSize(size);
  const sc = scale ?? DEFAULT_GOOGLE_SCALE;
  const type: GoogleMapType = mapType ?? DEFAULT_GOOGLE_MAPTYPE;
  const color = markerColor ?? DEFAULT_MARKER_COLOR;

  const qp =
    `center=${latitude},${longitude}&zoom=${z}&size=${width}x${height}&scale=${sc}&maptype=${enc(type)}` +
    `&markers=color:${enc(color)}|${latitude},${longitude}${googleApiKey ? `&key=${enc(googleApiKey)}` : ''}`;

  return { url: `${GOOGLE_STATIC_BASE}?${qp}`, width, height };
}

function buildOsmStaticUrl(
  { latitude, longitude }: Coords,
  { zoom }: StaticOpts
): { url: string; width: number; height: number } {
  const z = zoom ?? DEFAULT_ZOOM;
  const { x, y } = lonLatToTile(longitude, latitude, z);
  const url = `${OSM_TILE_BASE}/${z}/${x}/${y}.png`;
  return { url, width: 256, height: 256 };
}

export function staticMapUrl(
  provider: MapProviderName,
  coords: Coords,
  opts: StaticOpts = {}
): { url: string; width: number; height: number } {
  switch (provider) {
    case 'google':
      return buildGoogleStaticUrl(coords, opts);
    case 'osm':
      return buildOsmStaticUrl(coords, opts);
    default: {
      const _never: never = provider;
      throw new Error(`Unsupported provider: ${_never}`);
    }
  }
}

// iOS
async function iosGoogleLink({ latitude, longitude }: Coords): Promise<string> {
  const query = `${latitude},${longitude}`;
  const appScheme = `comgooglemaps://?q=${enc(query)}`;

  try {
    if (await Linking.canOpenURL(appScheme)) return appScheme;
  } catch {
    // fall back to web
  }
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

function iosOsmLink({ latitude, longitude }: Coords): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${DEFAULT_ZOOM}/${latitude}/${longitude}`;
}

function iosAppleLink({ latitude, longitude }: Coords): string {
  const query = `${latitude},${longitude}`;
  return `https://maps.apple.com/?ll=${query}&q=${enc(query)}`;
}

// Android
function androidGoogleLikeLink({ latitude, longitude }: Coords): string {
  const query = `${latitude},${longitude}`;
  return `geo:${query}?q=${enc(query)}`;
}

function androidOsmLink({ latitude, longitude }: Coords): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${DEFAULT_ZOOM}/${latitude}/${longitude}`;
}

export async function mapsDeepLink(provider: AnyProvider, coords: Coords): Promise<string> {
  if (Platform.OS === 'ios') {
    switch (provider) {
      case 'google': {
        const url = await iosGoogleLink(coords); 
        return url;
      }
      case 'osm':
        return iosOsmLink(coords);
      case 'apple':
        return iosAppleLink(coords);
      default:
        return iosAppleLink(coords);
    }
  }

  // Android
  switch (provider) {
    case 'google':
    case 'apple':
      return androidGoogleLikeLink(coords);
    case 'osm':
      return androidOsmLink(coords);
    default:
      return androidGoogleLikeLink(coords);
  }
}

export const providerLabel = (p: MapProviderName) => (p === 'google' ? I18n.t('Google_Maps') : I18n.t('OpenStreetMap'));
export const providerAttribution = (p: MapProviderName) => (p === 'google' ? undefined : I18n.t('OSM_Attribution'));

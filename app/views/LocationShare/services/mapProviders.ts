// maps.ts
import { Linking, Platform } from 'react-native';

/* =========================
 * Types
 * ========================= */
export type MapProviderName = 'google' | 'osm';
type AppleProvider = 'apple';
type AnyProvider = MapProviderName | AppleProvider;
type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export type Coords = { latitude: number; longitude: number };

export type StaticOpts = {
	zoom?: number; // default: 15
	size?: `${number}x${number}`; // e.g., "640x320"
	scale?: 1 | 2 | 3; // Google only (default: 2)
	mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'; // Google only
	googleApiKey?: string; // prefer server-signed URLs in prod
	osmServer?: string; // (unused here) custom OSM static server base
	osmApiKey?: string; // LocationIQ key
	markerColor?: string; // default: "red"
};

/* =========================
 * Constants
 * ========================= */
const DEFAULT_ZOOM = 15;
const DEFAULT_SIZE = '640x320';
const DEFAULT_GOOGLE_SCALE: 1 | 2 | 3 = 2;
const DEFAULT_GOOGLE_MAPTYPE: GoogleMapType = 'roadmap';
const DEFAULT_MARKER_COLOR = 'red';

const GOOGLE_STATIC_BASE = 'https://maps.googleapis.com/maps/api/staticmap';
// LocationIQ Static Maps docs: https://locationiq.com/docs#static-maps
const OSM_STATIC_BASE = 'https://maps.locationiq.com/v3/staticmap';

/* =========================
 * Helpers
 * ========================= */
function parseSize(size: StaticOpts['size'] | undefined) {
	const [wStr, hStr] = (size ?? DEFAULT_SIZE).split('x');
	const width = Number(wStr) || 640;
	const height = Number(hStr) || 320;
	return { width, height };
}

function enc(s: string | number) {
	return encodeURIComponent(String(s));
}

/* =========================
 * Static Map URL (by provider)
 * ========================= */
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
		`center=${latitude},${longitude}` +
		`&zoom=${z}` +
		`&size=${width}x${height}` +
		`&scale=${sc}` +
		`&maptype=${enc(type)}` +
		`&markers=color:${enc(color)}|${latitude},${longitude}` +
		(googleApiKey ? `&key=${enc(googleApiKey)}` : '');

	return { url: `${GOOGLE_STATIC_BASE}?${qp}`, width, height };
}

function buildOsmStaticUrl(
	{ latitude, longitude }: Coords,
	{ zoom, size, osmApiKey }: StaticOpts
): { url: string; width: number; height: number } {
	const z = zoom ?? DEFAULT_ZOOM;
	const { width, height } = parseSize(size);
	const marker = `icon:large-red-cutout|${latitude},${longitude}`;

	const qp =
		(osmApiKey ? `key=${enc(osmApiKey)}` : '') +
		`&center=${latitude},${longitude}` +
		`&zoom=${z}` +
		`&size=${width}x${height}` +
		`&markers=${enc(marker)}`;

	return { url: `${OSM_STATIC_BASE}?${qp}`, width, height };
}

/**
 * Public API: build a static map image URL for a provider.
 */
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
		default:
			// Exhaustiveness check
			const _never: never = provider;
			throw new Error(`Unsupported provider: ${_never}`);
	}
}

/* =========================
 * Deep Links (by platform x provider)
 * ========================= */
// --- iOS builders ---
async function iosGoogleLink({ latitude, longitude }: Coords): Promise<string> {
	// Prefer Google Maps app if installed
	const query = `${latitude},${longitude}`;
	const appScheme = `comgooglemaps://?q=${enc(query)}`;

	try {
		if (await Linking.canOpenURL(appScheme)) return appScheme;
	} catch {
		// ignore and fall back to web
	}
	// Fallback: Google Maps web
	return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

function iosOsmLink({ latitude, longitude }: Coords): string {
	// OSM opens on Safari
	return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${DEFAULT_ZOOM}/${latitude}/${longitude}`;
}

function iosAppleLink({ latitude, longitude }: Coords): string {
	const query = `${latitude},${longitude}`;
	return `https://maps.apple.com/?ll=${query}&q=${enc(query)}`;
}

// --- Android builders ---
function androidGoogleLikeLink({ latitude, longitude }: Coords): string {
	// geo: is handled by Google Maps or any compatible app chooser
	const query = `${latitude},${longitude}`;
	return `geo:${query}?q=${enc(query)}`;
}

function androidOsmLink({ latitude, longitude }: Coords): string {
	// Use OSM web (reliable across Android devices)
	return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${DEFAULT_ZOOM}/${latitude}/${longitude}`;
}

/**
 * Public API: build a deep link for maps, grouped by platform and provider.
 * - iOS:
 *   - 'google': try app -> fallback web
 *   - 'osm'   : web
 *   - 'apple' : Apple Maps web
 * - Android:
 *   - 'google'|'apple': geo: scheme (handled by default app chooser / Google Maps)
 *   - 'osm'           : web
 */
export async function mapsDeepLink(provider: AnyProvider, coords: Coords): Promise<string> {
	if (Platform.OS === 'ios') {
		switch (provider) {
			case 'google':
				return iosGoogleLink(coords);
			case 'osm':
				return iosOsmLink(coords);
			case 'apple':
				return iosAppleLink(coords);
			default:
				// default iOS to Apple Maps web
				return iosAppleLink(coords);
		}
	}

	// ANDROID
	switch (provider) {
		case 'google':
		case 'apple':
			return androidGoogleLikeLink(coords);
		case 'osm':
			return androidOsmLink(coords);
		default:
			// default Android to geo:
			return androidGoogleLikeLink(coords);
	}
}

/* =========================
 * Labels / Attributions
 * ========================= */
export const providerLabel = (p: MapProviderName) => (p === 'google' ? 'Google Maps' : 'OpenStreetMap');

export const providerAttribution = (p: MapProviderName) => (p === 'google' ? undefined : '© OpenStreetMap contributors');
